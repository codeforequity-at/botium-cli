const util = require('util')
const yargs = require('yargs')
const debug = require('debug')('botium-cli-import')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  if (!argv.source) {
    return yargs.showHelp()
  }

  if (argv.source === 'watson-intents') {
    require('./watsonintents').importWatsonIntents(argv.convos[0])
  } else if (argv.source === 'watson-logs') {
    require('./watsonintents').importWatsonLogs(argv.convos[0], argv.watsonfilter)
  } else if (argv.source === 'dialogflow-intents') {
    require('./dialogflowintents').importDialogflowIntents(argv.convos[0])
  } else if (argv.source === 'dialogflow-conversations') {
    require('./dialogflowintents').importDialogflowConversations(argv.convos[0])
  }
}

module.exports = {
  command: 'import [source]',
  describe: 'Importing conversations for Botium',
  builder: (yargs) => {
    yargs.positional('source', {
      describe: 'Specify the source of the conversations for the configured chatbot',
      choices: [ 'watson-intents', 'watson-logs', 'dialogflow-intents', 'dialogflow-conversations' ]
    })
    yargs.option('watsonfilter', {
      describe: 'Filter for downloading the watson logs, for example "response_timestamp>=2018-08-20,response_timestamp<2018-08-22"'
    })
  },
  handler
}
