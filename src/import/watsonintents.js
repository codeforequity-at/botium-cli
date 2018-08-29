const util = require('util')
const slug = require('slug')
const async = require('async')
const botium = require('botium-core')
const debug = require('debug')('botium-cli-import-watson-intents')
const helpers = require('./helpers')

module.exports.importWatsonIntents = (config, outputDir) => {
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
              const inputUtterances = intent.examples.map((e) => e.text)
              const utterancesRef = slug(intent.intent + '_input')

              const convo = {
                header: {
                  name: intent.intent
                },
                conversation: [
                  {
                    sender: 'me',
                    messageText: utterancesRef
                  },
                  {
                    sender: 'bot',
                    messageText: intent.intent
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
                const filename = helpers.writeUtterances(botiumContext.compiler, utterancesRef, inputUtterances, outputDir)
                console.log(`SUCCESS: wrote utterances to file ${filename}`)
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

module.exports.importWatsonLogs = (config, outputDir, filter) => {
  debug(JSON.stringify(config, null, 2))

  return new Promise((resolve, reject) => {
    const botiumContext = {
      driver: new botium.BotDriver()
        .setCapabilities(config.botium.Capabilities)
        .setEnvs(config.botium.Envs)
        .setSources(config.botium.Sources),
      compiler: null,
      container: null,
      logs: null
    }

    async.series([
      (capsChecked) => {
        if (botiumContext.driver.caps[botium.Capabilities.CONTAINERMODE] !== 'watsonconversation') {
          return capsChecked(`action only supported for IBM Watson Assistent drivers, found driver ${botiumContext.driver.caps[botium.Capabilities.CONTAINERMODE]}`)
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

      (workspaceRead) => {
        botiumContext.container.conversation.getWorkspace({
          workspace_id: botiumContext.driver.caps[botium.Capabilities.WATSONCONVERSATION_WORKSPACE_ID],
          export: false
        }, (err, workspace) => {
          if (err) {
            workspaceRead(`Watson workspace connection failed: ${util.inspect(err)}`)
          } else {
            debug(`Got Watson workspace ${workspace.name}`)
            botiumContext.workspace = workspace
            workspaceRead()
          }
        })
      },

      (logsRead) => {
        botiumContext.logs = []

        const pageParams = {
          workspace_id: botiumContext.driver.caps[botium.Capabilities.WATSONCONVERSATION_WORKSPACE_ID],
          page_limit: 1000,
          sort: 'request_timestamp',
          filter
        }
        let hasMore = true
        async.whilst(
          () => hasMore,
          (pageRead) => {
            debug(`Watson workspace gettings logs page: ${pageParams.cursor}`)
            botiumContext.container.conversation.listLogs(pageParams, (err, pageResult) => {
              if (err) {
                pageRead(`Watson workspace connection failed: ${util.inspect(err)}`)
              } else {
                botiumContext.logs = botiumContext.logs.concat(pageResult.logs)
                if (pageResult.pagination && pageResult.pagination.next_cursor) {
                  hasMore = true
                  pageParams.cursor = pageResult.pagination.next_cursor
                } else {
                  hasMore = false
                }
                pageRead()
              }
            })
          },
          (err) => {
            if (!err) debug(`Watson workspace got ${botiumContext.logs.length} log entries`)
            logsRead(err)
          }
        )
      },

      (filesWritten) => {
        if (!botiumContext.logs) return filesWritten('Watson conversation returned no logs')

        const convos = []
        const convosById = {}

        botiumContext.logs.forEach((log) => {
          const conversationId = log.response.context.conversation_id

          let convo = { header: {}, conversation: [] }
          if (convosById[conversationId]) {
            convo = convosById[conversationId]
          } else {
            convosById[conversationId] = convo
            convos.push(convo)
          }

          if (log.request.input && log.request.input.text) {
            convo.conversation.push({ sender: 'me', messageText: log.request.input.text, timestamp: log.request_timestamp })
          }
          if (log.response.output && log.response.output.text) {
            log.response.output.text.forEach((messageText) => {
              if (messageText) convo.conversation.push({ sender: 'bot', messageText, timestamp: log.response_timestamp })
            })
          }
        })
        debug(`Watson logs got ${convos.length} convos`)

        try {
          const filename = helpers.writeConvosExcel(botiumContext.compiler, convos, outputDir, botiumContext.workspace.name)
          console.log(`SUCCESS: wrote convos to file ${filename}`)
          filesWritten()
        } catch (err) {
          console.log(`ERROR: writing convos failed: ${util.inspect(err)}`)
          filesWritten(err)
        }
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
