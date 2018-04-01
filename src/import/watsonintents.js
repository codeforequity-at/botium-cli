const util = require('util')
const slug = require('slug')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const async = require('async')
const botium = require('botium-core')
const debug = require('debug')('botium-cli-import-watson-intents')

const writeConvo = (compiler, convo, outputDir) => {
  const filename = path.resolve(outputDir, slug(convo.header.name) + '.convo.txt')

  mkdirp.sync(outputDir)

  const scriptData = compiler.Decompile([ convo ], 'SCRIPTING_FORMAT_TXT')

  fs.writeFileSync(filename, scriptData)
  console.log(`SUCCESS: wrote convo to file ${filename}`)
}

const writeUtterances = (compiler, utterance, samples, outputDir) => {
  const filename = path.resolve(outputDir, slug(utterance) + '.utterances.txt')

  mkdirp.sync(outputDir)

  const scriptData = [ utterance, ...samples ].join('\n')

  fs.writeFileSync(filename, scriptData)
  console.log(`SUCCESS: wrote utterances to file ${filename}`)
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
      workspace: null
    }

    async.series([
      (capsChecked) => {
        if (botiumContext.driver.caps[botium.Capabilities.CONTAINERMODE] !== 'watsonconversation') {
          return capsChecked(`action only supported for IBM Watson Assistent drivers, found driver ${botiumContext.driver.caps[botium.Capabilities.CONTAINERMODE]}`)
        }
        botiumContext.driver.caps[botium.Capabilities.WATSONCONVERSATION_COPY_WORKSPACE] = false
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

      (workspaceRead) => {
        botiumContext.container.conversation.getWorkspace({
          workspace_id: botiumContext.driver.caps[botium.Capabilities.WATSONCONVERSATION_WORKSPACE_ID],
          export: true
        }, (err, workspace) => {
          if (err) {
            workspaceRead(`Watson workspace connection failed: ${util.inspect(err)}`)
          } else {
            debug(`Watson workspace got intents: ${JSON.stringify(workspace.intents, null, 2)}`)
            botiumContext.workspace = workspace
            workspaceRead()
          }
        })
      },

      (filesWritten) => {
        async.parallelLimit(
          botiumContext.workspace.intents.map((intent) => {
            return (intentWritten) => {
              const convo = {
                header: {
                  name: intent.intent
                },
                conversation: [
                  {
                    sender: 'me',
                    messageText: intent.intent + '_input'
                  },
                  {
                    sender: 'bot',
                    messageText: intent.intent
                  }
                ]
              }
              try {
                writeConvo(botiumContext.compiler, convo, outputDir)
              } catch (err) {
                console.log(`WARNING: writing convo for intent "${intent.intent}" failed: ${util.inspect(err)}`)
              }
              try {
                writeUtterances(botiumContext.compiler,
                  intent.intent + '_input',
                  intent.examples.map((e) => e.text),
                  outputDir)
              } catch (err) {
                console.log(`WARNING: writing utterances for intent "${intent.intent}" failed: ${util.inspect(err)}`)
              }
              intentWritten()
            }
          }),
          20,
          (err) => {
            filesWritten(err)
          }
        )
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
