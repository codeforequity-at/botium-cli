const util = require('util')
const debug = require('debug')('botium-bindings-cli')
const start = require('botium-connector-alexa-avs/src/tools/CreateCapabilitiesImpl').execute

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)
  start()
}

module.exports = {
  command: 'init-alexa-avs',
  describe: 'Run the "Botium Connector Alexa AVS Initialization Tool"',
  handler
}
