const util = require('util')
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

    const convo = {
      header: {
        name: intent.name
      },
      conversation: [
        {
          sender: 'me',
          messageText: intent.name + '_input'
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
      const filename = helpers.writeUtterances(botiumContext.compiler,
        intent.name + '_input',
        utterances.map((utterance) => utterance.data.reduce((accumulator, currentValue) => accumulator + '' + currentValue.text, '')),
        outputDir)
      console.log(`SUCCESS: wrote utterances to file ${filename}`)
    } catch (err) {
      console.log(`WARNING: writing utterances for intent "${intent.intent}" failed: ${util.inspect(err)}`)
    }
  })
  filesWritten()
}

module.exports = (config, outputDir) => {
  debug(JSON.stringify(config, null, 2))

  return new Promise((resolve, reject) => {
    const botiumContext = {
      driver: new botium.BotDriver()
        .setCapabilities(config.botium.Capabilities)
        .setEnvs(config.botium.Envs)
        .setSources(config.botium.Sources),
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
        importIntents(outputDir, botiumContext, filesWritten)
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
