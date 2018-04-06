const util = require('util')
const debug = require('debug')('botium-cli-emulator')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  const emulator = require('./console')
  emulator(argv.configJson, argv.convos[0])
}

module.exports = {
  command: 'emulator',
  describe: 'Launch Botium console emulator',
  handler
}
