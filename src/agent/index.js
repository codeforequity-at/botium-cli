const util = require('util')
const yargsCmd = require('yargs')
const debug = require('debug')('botium-cli-agent')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  if (!argv.ui) {
    return yargsCmd.showHelp()
  }

  if (argv.port) {
    process.env.PORT = argv.port
  }
  require('botium-core/src/grid/agent/agent')
}

module.exports = {
  command: 'agent',
  describe: 'Launch Botium agent',
  builder: (yargs) => {
    yargs.option('port', {
      describe: 'Local port the agent is listening to',
      number: true
    })
    yargs.option('apitoken', {
      describe: 'API Token for clients to connect (also read from env variable "BOTIUM_API_TOKEN")',
      number: true
    })
  },
  handler
}
