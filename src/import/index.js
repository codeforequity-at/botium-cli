const util = require('util')
const yargsCmd = require('yargs')
const debug = require('debug')('botium-cli-import')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  if (!argv.source) {
    return yargsCmd.showHelp()
  }
  if (argv.watsonformat && argv.watsonformat !== 'convo' && argv.watsonformat !== 'intent') {
    return yargsCmd.showHelp()
  }

  if (argv.source === 'watson-intents') {
    require('./watsonintents').importWatsonIntents(argv.convos[0]).catch(() => {})
  } else if (argv.source === 'watson-logs') {
    require('./watsonintents').importWatsonLogs(argv.convos[0], argv.watsonfilter, argv.watsonformat || 'convo').catch(() => {})
  }
}

module.exports = {
  command: 'import [source]',
  describe: 'Importing conversations for Botium',
  builder: (yargs) => {
    yargs.positional('source', {
      describe: 'Specify the source of the conversations for the configured chatbot',
      choices: [ 'watson-intents', 'watson-logs' ]
    })
    yargs.option('watsonfilter', {
      describe: 'Filter for downloading the watson logs, for example "response_timestamp>=2018-08-20,response_timestamp<2018-08-22"'
    })
    yargs.option('watsonformat', {
      describe: 'Format for downloading the watson logs. "convo" for full conversations, "intent" for intent-list only (default: "convo")'
    })
  },
  handler
}
