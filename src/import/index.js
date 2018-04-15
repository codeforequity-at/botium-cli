const util = require('util')
const yargs = require('yargs')
const debug = require('debug')('botium-cli-import')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  if (!argv.source) {
    return yargs.showHelp()
  }

  if (argv.source === 'watson-intents') {
    require('./watsonintents')(argv.configJson, argv.convos[0])
  } else if (argv.source === 'dialogflow-intents') {
    require('./dialogflowintents')(argv.configJson, argv.convos[0])
  }
}

module.exports = {
  command: 'import [source]',
  describe: 'Importing conversations for Botium',
  builder: (yargs) => {
    yargs.positional('source', {
      describe: 'Specify the source of the conversations for the configured chatbot',
      choices: [ 'watson-intents', 'dialogflow-intents' ]
    })
  },
  handler
}
