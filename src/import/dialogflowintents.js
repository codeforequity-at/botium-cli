const util = require('util')
const slug = require('slug')
const async = require('async')
const AdmZip = require('adm-zip')
const dialogflow = require('dialogflow')
const botium = require('botium-core')
const debug = require('debug')('botium-cli-import-watson-intents')
const helpers = require('./helpers')

const importIntents = (outputDir, botiumContext, filesWritten) => {
  const intentEntries = botiumContext.zipEntries.filter((zipEntry) => zipEntry.entryName.startsWith('intent') && !zipEntry.entryName.match('usersays'))

  intentEntries.forEach((zipEntry) => {
    const intent = JSON.parse(botiumContext.unzip.readAsText(zipEntry.entryName))
    if (intent.parentId) return

    const utterancesEntry = zipEntry.entryName.replace('.json', '') + '_usersays_' + botiumContext.agentInfo.language + '.json'
    debug(`Found root intent ${intent.name}, checking for utterances in ${utterancesEntry}`)
    if (!botiumContext.zipEntries.find((zipEntry) => zipEntry.entryName === utterancesEntry)) {
      debug(`Utterances files not found for ${intent.name}, ignoring intent`)
      return
    }
    const utterances = JSON.parse(botiumContext.unzip.readAsText(utterancesEntry))
    const inputUtterances = utterances.map((utterance) => utterance.data.reduce((accumulator, currentValue) => accumulator + '' + currentValue.text, ''))
    const utteranceRef = slug(intent.name + '_input')

    const convo = {
      header: {
        name: intent.name
      },
      conversation: [
        {
          sender: 'me',
          messageText: utteranceRef
        },
        {
          sender: 'bot',
          messageText: intent.name
        }
      ]
    }
    try {
      const filename = helpers.writeConvo(botiumContext.compiler, convo, outputDir)
      console.log(`SUCCESS: wrote convo to file ${filename}`)
    } catch (err) {
      console.log(`WARNING: writing convo for intent "${intent.intent}" failed: ${util.inspect(err)}`)
    }
    try {
      const filename = helpers.writeUtterances(botiumContext.compiler, utteranceRef, inputUtterances, outputDir)
      console.log(`SUCCESS: wrote utterances to file ${filename}`)
    } catch (err) {
      console.log(`WARNING: writing utterances for intent "${intent.intent}" failed: ${util.inspect(err)}`)
    }
  })
  filesWritten()
}

const importConversations = (outputDir, botiumContext, filesWritten) => {
  const intentEntries = botiumContext.zipEntries.filter((zipEntry) => zipEntry.entryName.startsWith('intent') && !zipEntry.entryName.match('usersays'))

  const intentsById = {}
  intentEntries.forEach((zipEntry) => {
    const intent = JSON.parse(botiumContext.unzip.readAsText(zipEntry.entryName))

    const utterancesEntry = zipEntry.entryName.replace('.json', '') + '_usersays_' + botiumContext.agentInfo.language + '.json'
    debug(`Found intent ${intent.name}, checking for utterances in ${utterancesEntry}`)
    if (!botiumContext.zipEntries.find((zipEntry) => zipEntry.entryName === utterancesEntry)) {
      debug(`Utterances files not found for ${intent.name}, ignoring intent`)
      return
    }
    intentsById[intent.id] = intent

    const utterances = JSON.parse(botiumContext.unzip.readAsText(utterancesEntry))
    intent.inputUtterances = utterances.map((utterance) => utterance.data.reduce((accumulator, currentValue) => accumulator + '' + currentValue.text, ''))
    debug(`Utterances file for ${intent.name}: ${intent.inputUtterances}`)

    intent.outputUtterances = []
    if (intent.responses) {
      intent.responses.forEach((response) => {
        if (response.messages) {
          const speechOutput = response.messages.find((message) => message.type === 0 && message.lang === botiumContext.agentInfo.language && message.speech)
          if (speechOutput) {
            intent.outputUtterances.push(speechOutput.speech)
          } else {
            intent.outputUtterances.push([])
          }
        } else {
          intent.outputUtterances.push([])
        }
      })
    }
  })
  Object.keys(intentsById).forEach((intentId) => {
    const intent = intentsById[intentId]
    console.log(intent.name + '/' + intent.parentId)
    if (intent.parentId) {
      const parent = intentsById[intent.parentId]
      if (parent) {
        if (!parent.children) parent.children = []
        parent.children.push(intent)
      } else {
        debug(`Parent intent with id ${intent.parentId} not found for ${intent.name}, ignoring intent`)
      }
      delete intentsById[intentId]
    }
  })

  const follow = (intent, currentStack = []) => {
    const cp = currentStack.slice(0)

    const utterancesRef = slug(intent.name + '_input')
    cp.push({ sender: 'me', messageText: utterancesRef, intent: intent.name })

    try {
      const filename = helpers.writeUtterances(botiumContext.compiler, utterancesRef, intent.inputUtterances, outputDir)
      console.log(`SUCCESS: wrote utterances to file ${filename}`)
    } catch (err) {
      console.log(`WARNING: writing input utterances for intent "${intent.intent}" failed: ${util.inspect(err)}`)
    }

    if (intent.outputUtterances && intent.outputUtterances.length > 0) {
      for (let stepIndex = 0; stepIndex < intent.outputUtterances.length; stepIndex++) {
        if (intent.outputUtterances[stepIndex] && intent.outputUtterances[stepIndex].length > 0) {
          const utterancesRef = slug(intent.name + '_output_' + stepIndex)

          cp.push({ sender: 'bot', messageText: utterancesRef })
          try {
            const filename = helpers.writeUtterances(botiumContext.compiler, utterancesRef, intent.outputUtterances[stepIndex], outputDir)
            console.log(`SUCCESS: wrote utterances to file ${filename}`)
          } catch (err) {
            console.log(`WARNING: writing output utterances for intent "${intent.intent}" failed: ${util.inspect(err)}`)
          }
        } else {
          cp.push({ sender: 'bot', messageText: '!INCOMPREHENSION' })
        }
      }
    } else {
      cp.push({ sender: 'bot', messageText: '!INCOMPREHENSION' })
    }

    if (intent.children) {
      intent.children.forEach((child) => {
        follow(child, cp)
      })
    } else {
      const convo = {
        header: {
          name: cp.filter((m) => m.sender === 'me').map((m) => m.intent).join(' - ')
        },
        conversation: cp
      }
      console.log(convo)
      try {
        const filename = helpers.writeConvo(botiumContext.compiler, convo, outputDir)
        console.log(`SUCCESS: wrote convo to file ${filename}`)
      } catch (err) {
        console.log(`WARNING: writing convo for intent "${intent.intent}" failed: ${util.inspect(err)}`)
      }
    }
  }
  Object.keys(intentsById).forEach((intentId) => follow(intentsById[intentId], []))

  filesWritten()
}

const importDialogflow = (outputDir, importFunction) => {
  return new Promise((resolve, reject) => {
    const botiumContext = {
      driver: new botium.BotDriver(),
      compiler: null,
      container: null,
      agentsClient: null,
      projectPath: null,
      unzip: null,
      zipEntries: null,
      agentInfo: null
    }

    async.series([
      (capsChecked) => {
        if (botiumContext.driver.caps[botium.Capabilities.CONTAINERMODE] !== 'dialogflow') {
          return capsChecked(`action only supported for Google Dialogflow drivers, found driver ${botiumContext.driver.caps[botium.Capabilities.CONTAINERMODE]}`)
        }
        capsChecked()
      },

      (containerReady) => {
        botiumContext.driver.Build()
          .then((c) => {
            botiumContext.container = c
            containerReady()
          })
          .catch(containerReady)
      },

      (compilerReady) => {
        try {
          botiumContext.compiler = botiumContext.driver.BuildCompiler()
          compilerReady()
        } catch (err) {
          compilerReady(err)
        }
      },

      (agentRead) => {
        try {
          botiumContext.agentsClient = new dialogflow.v2beta1.AgentsClient(botiumContext.container.sessionOpts)
          botiumContext.projectPath = botiumContext.agentsClient.projectPath(botiumContext.container.caps[botium.Capabilities.DIALOGFLOW_PROJECT_ID])
          agentRead()
        } catch (err) {
          agentRead(err)
        }
      },

      (agentExported) => {
        botiumContext.agentsClient.exportAgent({ parent: botiumContext.projectPath })
          .then(responses => responses[0].promise())
          .then(responses => {
            try {
              let buf = Buffer.from(responses[0].agentContent, 'base64')
              botiumContext.unzip = new AdmZip(buf)
              botiumContext.zipEntries = botiumContext.unzip.getEntries()
              botiumContext.zipEntries.forEach((zipEntry) => {
                debug(`Dialogflow agent got entry: ${zipEntry.entryName}`)
              })
              botiumContext.agentInfo = JSON.parse(botiumContext.unzip.readAsText('agent.json'))
              debug(`Dialogflow agent info: ${util.inspect(botiumContext.agentInfo)}`)

              agentExported()
            } catch (err) {
              agentExported(`Dialogflow agent unpack failed: ${util.inspect(err)}`)
            }
          })
          .catch(err => {
            agentExported(`Dialogflow agent connection failed: ${util.inspect(err)}`)
          })
      },

      (filesWritten) => {
        importFunction(outputDir, botiumContext, filesWritten)
      }

    ],
    (err) => {
      if (err) {
        console.log(`FAILED: ${err}`)
        reject(err)
      } else resolve()
    })
  })
}

module.exports.importDialogflowIntents = (outputDir) => importDialogflow(outputDir, importIntents)
module.exports.importDialogflowConversations = (outputDir) => importDialogflow(outputDir, importConversations)
