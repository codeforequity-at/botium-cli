const util = require('util')
const fs = require('fs')
const _ = require('lodash')
const { BotDriver } = require('botium-core')
const debug = require('debug')('botium-cli-nlp')

const getConnector = (containermode) => {
  if (containermode.startsWith('botium-connector')) {
    return require(containermode)
  } else {
    return require(`botium-connector-${containermode}`)
  }
}

const splitArray = (array = [], nPieces = 1) => {
  const splitArray = []
  let atArrPos = 0
  for (let i = 0; i < nPieces; i++) {
    const splitArrayLength = Math.ceil((array.length - atArrPos) / (nPieces - i))
    splitArray.push([])
    splitArray[i] = array.slice(atArrPos, splitArrayLength + atArrPos)
    atArrPos += splitArrayLength
  }
  return splitArray
}

const makeFolds = (intents, k, shuffle, intentFilter) => {
  const result = []

  for (let i = 0; i < k; i++) {
    const chunk = intents.map(intent => {
      if (intent.utterances.length < k) {
        debug(`Intent ${intent.intentName} has too less utterances (${intent.utterances.length}), no folds created.`)
        return {
          intentName: intent.intentName,
          train: intent.utterances
        }
      }
      if (intentFilter && intentFilter.indexOf(intent.intentName) < 0) {
        debug(`Intent ${intent.intentName} is not in filter, no folds created.`)
        return {
          intentName: intent.intentName,
          train: intent.utterances
        }
      }
      const chunks = splitArray(shuffle ? _.shuffle(intent.utterances) : intent.utterances, k)
      return {
        intentName: intent.intentName,
        test: chunks[i],
        train: _.flatten(_.filter(chunks, (s, chunkIndex) => chunkIndex !== i))
      }
    })
    result.push(chunk)
  }
  return result
}

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  const driver = new BotDriver()
  const compiler = driver.BuildCompiler()
  const pluginConnector = getConnector(driver.caps.CONTAINERMODE)

  if (!pluginConnector || !pluginConnector.NLP) {
    console.log(`NLP Analytics not supported by connector ${driver.caps.CONTAINERMODE}`)
  }
  const { ExtractIntentUtterances, TrainIntentUtterances, CleanupIntentUtterances } = pluginConnector.NLP

  if (argv.algorithm === 'k-fold') {
    // eslint-disable-next-line no-unexpected-multiline
    (async () => {
      let extractedIntents = null
      if (argv.extract) {
        try {
          debug('Extracting utterances ...')
          extractedIntents = await ExtractIntentUtterances({})
        } catch (err) {
          console.log(`K-Fold failed to extract utterances: ${err.message}`)
          return
        }
      } else {
        argv.convos.forEach((convodir) => {
          compiler.ReadScriptsFromDirectory(convodir)
        })
        extractedIntents = {
          intents: Object.keys(compiler.utterances).map(intentName => ({
            intentName,
            utterances: compiler.utterances[intentName].utterances
          }))
        }
      }
      const originalIntents = extractedIntents.intents
      debug(`Extracted intent utterances: ${JSON.stringify(originalIntents.map(i => ({ intentName: i.intentName, utterances: i.utterances.length })), null, 2)}`)

      const folds = makeFolds(originalIntents, argv.k, argv.shuffle, argv.intents)
      console.log(`Created ${argv.k} folds (shuffled: ${argv.shuffle})`)

      const foldMatrices = []
      const predictionDetails = []

      for (let k = 0; k < folds.length; k++) {
        const foldIntents = folds[k]

        const trainingData = foldIntents.map(fi => ({
          intentName: fi.intentName,
          utterances: fi.train
        }))

        console.log(`Starting training for fold ${k + 1}`)
        let trainResult = null
        try {
          trainResult = await TrainIntentUtterances({}, trainingData, extractedIntents)
        } catch (err) {
          console.log(`K-Fold training for fold ${k + 1} failed: ${err.message}`)
          return
        }

        console.log(`Starting testing for fold ${k + 1}`)
        try {
          const testIntents = foldIntents.filter(fi => fi.test)

          const intentPromises = testIntents.map(async (foldIntent) => {
            foldIntent.predictions = {}

            const foldDriver = new BotDriver(trainResult.caps)
            const foldContainer = await foldDriver.Build()

            for (const utt of foldIntent.test) {
              try {
                await foldContainer.Start()

                await foldContainer.UserSaysText(utt)
                const botMsg = await foldContainer.WaitBotSays()

                const predictedIntentName = _.get(botMsg, 'nlp.intent.name') || 'None'
                const mappedIntentName = (trainResult.trainedIntents && (trainResult.trainedIntents.find(ti => ti.mapFromIntentName === predictedIntentName) || {}).intentName) || predictedIntentName

                if (mappedIntentName) {
                  foldIntent.predictions[mappedIntentName] = (foldIntent.predictions[mappedIntentName] || 0) + 1
                }

                foldIntent.techok = (foldIntent.techok || 0) + 1
                predictionDetails.push({
                  fold: k,
                  match: (foldIntent.intentName === mappedIntentName) ? 'Y' : 'N',
                  utterance: utt,
                  expectedIntent: foldIntent.intentName,
                  predictedIntent: predictedIntentName
                })

                await foldContainer.Stop()
              } catch (err) {
                foldIntent.techfailures = (foldIntent.techfailures || 0) + 1
                predictionDetails.push({
                  fold: k,
                  match: 'N',
                  utterance: utt,
                  expectedIntent: foldIntent.intentName,
                  predictedIntent: null
                })

                console.log(`K-Fold Round ${k + 1}: Failed sending utterance "${utt}" - ${err.message}`)
              }
            }
            await foldContainer.Clean()
          })
          await Promise.all(intentPromises)

          const expectedIntents = {}
          for (const testIntent of testIntents) {
            expectedIntents[testIntent.intentName] = testIntent.predictions
          }
          const allIntentNames = foldIntents.map(fi => fi.intentName).concat(['None'])
          for (const intentName of allIntentNames) {
            expectedIntents[intentName] = expectedIntents[intentName] || { }
          }

          const matrix = []
          for (const testIntent of testIntents) {
            const totalPredicted = allIntentNames.reduce((agg, otherIntentName) => {
              return agg + (expectedIntents[otherIntentName][testIntent.intentName] || 0)
            }, 0)
            const totalExpected = allIntentNames.reduce((agg, otherIntentName) => {
              return agg + (testIntent.predictions[otherIntentName] || 0)
            }, 0)

            const score = {
              techok: testIntent.techok || 0,
              techfailures: testIntent.techfailures || 0
            }

            if (totalPredicted === 0) {
              score.precision = 0
            } else {
              score.precision = (testIntent.predictions[testIntent.intentName] || 0) / totalPredicted
            }
            if (totalExpected === 0) {
              score.recall = 0
            } else {
              score.recall = (testIntent.predictions[testIntent.intentName] || 0) / totalExpected
            }
            if (score.precision === 0 && score.recall === 0) {
              score.F1 = 0
            } else {
              score.F1 = 2 * ((score.precision * score.recall) / (score.precision + score.recall))
            }

            matrix.push({
              intent: testIntent.intentName,
              predictions: testIntent.predictions,
              score
            })
          }

          const foldMatrix = {
            techok: matrix.reduce((sum, r) => sum + r.score.techok, 0),
            techfailures: matrix.reduce((sum, r) => sum + r.score.techfailures, 0),
            precision: matrix.reduce((sum, r) => sum + r.score.precision, 0) / matrix.length,
            recall: matrix.reduce((sum, r) => sum + r.score.recall, 0) / matrix.length,
            matrix
          }
          if (foldMatrix.precision === 0 && foldMatrix.recall === 0) {
            foldMatrix.F1 = 0
          } else {
            foldMatrix.F1 = 2 * ((foldMatrix.precision * foldMatrix.recall) / (foldMatrix.precision + foldMatrix.recall))
          }
          foldMatrices.push(foldMatrix)

          console.log(`K-Fold Round ${k + 1}: Precision=${foldMatrix.precision.toFixed(4)} Recall=${foldMatrix.recall.toFixed(4)} F1-Score=${foldMatrix.F1.toFixed(4)} Tech.OK=${foldMatrix.techok} Tech.Failures=${foldMatrix.techfailures}`)
        } catch (err) {
          console.log(`K-Fold testing for fold ${k + 1} failed: ${err.message}`)
        } finally {
          try {
            await CleanupIntentUtterances({}, trainResult)
          } catch (err) {
            console.log(`K-Fold training for fold ${k + 1} failed: ${err.message}`)
          }
        }
      }
      const avgPrecision = foldMatrices.reduce((sum, r) => sum + r.precision, 0) / foldMatrices.length
      const avgRecall = foldMatrices.reduce((sum, r) => sum + r.recall, 0) / foldMatrices.length
      let avgF1 = 0
      if (avgPrecision !== 0 || avgRecall !== 0) {
        avgF1 = 2 * ((avgPrecision * avgRecall) / (avgPrecision + avgRecall))
      }

      console.log('############# Summary #############')
      for (let k = 0; k < foldMatrices.length; k++) {
        const foldMatrix = foldMatrices[k]
        console.log(`K-Fold Round ${k + 1}: Precision=${foldMatrix.precision.toFixed(4)} Recall=${foldMatrix.recall.toFixed(4)} F1-Score=${foldMatrix.F1.toFixed(4)} Tech.OK=${foldMatrix.techok} Tech.Failures=${foldMatrix.techfailures}`)
      }
      console.log(`K-Fold Avg: Precision=${avgPrecision.toFixed(4)} Recall=${avgRecall.toFixed(4)} F1-Score=${avgF1.toFixed(4)}`)

      const csvLines = [
        ['fold', 'intent', 'precision', 'recall', 'F1', 'Tech.OK', 'Tech.Failures'].join(';')
      ]
      for (let k = 0; k < foldMatrices.length; k++) {
        const foldMatrix = foldMatrices[k]
        for (let m = 0; m < foldMatrix.matrix.length; m++) {
          const matrix = foldMatrix.matrix[m]
          csvLines.push([
            `${k + 1}`,
            matrix.intent,
            matrix.score.precision.toFixed(4),
            matrix.score.recall.toFixed(4),
            matrix.score.F1.toFixed(4),
            matrix.score.techok,
            matrix.score.techfailures
          ].join(';'))
        }
      }
      try {
        fs.writeFileSync(argv.output, csvLines.join('\r\n'))
        console.log(`Wrote output file ${argv.output}`)
      } catch (err) {
        console.log(`Failed to write output file ${argv.output} - ${err.message}`)
      }

      const csvLinesPredictions = [
        ['fold', 'match', 'utterance', 'expectedIntent', 'predictedIntent'].join(';')
      ].concat(predictionDetails.map(d => [
        `${d.fold + 1}`,
        d.match,
        d.utterance || '',
        d.expectedIntent || '',
        d.predictedIntent || ''
      ].join(';')
      ))
      try {
        fs.writeFileSync(argv.outputPredictions, csvLinesPredictions.join('\r\n'))
        console.log(`Wrote predictions output file ${argv.outputPredictions}`)
      } catch (err) {
        console.log(`Failed to write predictions output file ${argv.outputPredictions} - ${err.message}`)
      }
    })()
  }
}

module.exports = {
  command: 'nlpanalytics <algorithm>',
  describe: 'Run Botium NLP Analytics',
  builder: (yargs) => {
    yargs.positional('algorithm', {
      describe: 'NLP Analytics Algorithm to use',
      choices: ['k-fold']
    })
    yargs.option('k', {
      describe: 'K for K-Fold',
      number: true,
      default: 5
    })
    yargs.option('shuffle', {
      describe: 'Shuffle utterances before K-Fold (monte carlo)',
      boolean: true,
      default: true
    })
    yargs.option('extract', {
      describe: 'extract utterances from connector workspace (otherwise load from --convos directory or .)',
      boolean: true,
      default: false
    })
    yargs.option('intents', {
      describe: 'Only evaluate for the given intents'
    })
    yargs.option('output', {
      describe: 'Output scores to CSV file',
      default: 'k-fold.csv'
    })
    yargs.option('outputPredictions', {
      describe: 'Output intent predictions to CSV file',
      default: 'k-fold-predictions.csv'
    })
  },
  handler,
  getConnector
}
