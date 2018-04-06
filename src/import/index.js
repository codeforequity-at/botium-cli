const util = require('util')
const fs = require('fs')
const yargs = require('yargs')
const debug = require('debug')('botium-cli-import')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  if (!argv.source || !argv.config) {
    return yargs.showHelp()
  }

  if (argv.verbose) {
    require('debug').enable('botium*')
  }

  let configJson = {}
  try {
    const contents = fs.readFileSync(argv.config)
    configJson = JSON.parse(contents)
  } catch (err) {
    console.log(`FAILED: configuration file ${argv.config} not readable`)
    debug(util.inspect(err))
    return
  }

  if (argv.source === 'watson-intents') {
    require('./watsonintents')(configJson, argv.convos)
  }
}

module.exports = {
  command: 'import [source]',
  describe: 'Importing conversations for Botium',
  builder: (yargs) => {
    yargs.positional('source', {
      describe: 'Specify the source of the conversations for the configured chatbot',
      choices: [ 'watson-intents' ]
    })
  },
  handler
}
