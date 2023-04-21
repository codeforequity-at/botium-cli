const util = require('util')
const path = require('path')
const fs = require('fs')
const yargsCmd = require('yargs')
const slug = require('slug')
const { mkdirpSync } = require('mkdirp')
const _ = require('lodash')
const { BotDriver } = require('botium-core')
const debug = require('debug')('botium-cli-nlp')

const writeUtterances = (filename, intentName, utterances) => {
  fs.writeFileSync(filename, [
    intentName,
    ...utterances
  ].join('\r\n'))
}

const split = async (argv) => {
  const trainDir = argv.train
  try {
    mkdirpSync(trainDir)
  } catch (err) {
    console.log(`Failed to create training data directory ${trainDir}: ${err.message}`)
    process.exit(1)
  }
  const testDir = argv.test
  try {
    mkdirpSync(testDir)
  } catch (err) {
    console.log(`Failed to create test data directory ${testDir}: ${err.message}`)
    process.exit(1)
  }

  const driver = new BotDriver()
  const compiler = driver.BuildCompiler()

  for (const convodir of argv.convos) {
    try {
      compiler.ReadScriptsFromDirectory(convodir)
    } catch (err) {
      console.log(`Failed to read convo directory ${convodir}: ${err.message}`)
      process.exit(1)
    }
  }

  const intents = Object.keys(compiler.utterances).map(intentName => ({
    intentName,
    utterances: compiler.utterances[intentName].utterances
  }))

  for (const intent of intents) {
    const utterancesShuffled = _.shuffle(intent.utterances)
    const uttCount = utterancesShuffled.length

    const uttCountTest = Math.floor((argv.percentage / 100) * uttCount)
    const utterancesTest = utterancesShuffled.slice(0, uttCountTest)
    const utterancesTrain = utterancesShuffled.slice(uttCountTest)
    console.log(`Split intent ${intent.intentName} into ${utterancesTest.length} test and ${utterancesTrain.length} training utterances`)

    const filenameTest = path.join(testDir, `${slug(intent.intentName)}.utterances.txt`)
    try {
      writeUtterances(filenameTest, intent.intentName, utterancesTest || [])
      console.log(`Wrote intent test utterances for ${intent.intentName} to ${filenameTest}`)
    } catch (err) {
      console.log(`Failed to write intent test utterances for ${intent.intentName} to ${filenameTest}: ${err.message}`)
    }

    const filenameTrain = path.join(trainDir, `${slug(intent.intentName)}.utterances.txt`)
    try {
      writeUtterances(filenameTrain, intent.intentName, utterancesTrain || [])
      console.log(`Wrote intent training utterances for ${intent.intentName} to ${filenameTrain}`)
    } catch (err) {
      console.log(`Failed to write intent training utterances for ${intent.intentName} to ${filenameTrain}: ${err.message}`)
    }
  }
}

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)
  if (argv.percentage < 0 || argv.percentage > 100) {
    return yargsCmd.showHelp()
  }
  split(argv)
}

module.exports = {
  command: 'nlpsplit',
  describe: 'Split utterances into a training and a test set',
  builder: (yargs) => {
    yargs.option('percentage', {
      describe: 'Percentage to put into test set (between 0 and 100)',
      number: true,
      default: 20
    })
    yargs.option('train', {
      describe: 'Folder to put training set'
    })
    yargs.option('test', {
      describe: 'Folder to put test set'
    })
  },
  handler
}
