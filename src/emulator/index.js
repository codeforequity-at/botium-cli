const util = require('util')
const debug = require('debug')('botium-cli-emulator')

const testmybot = require('testmybot')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  if (argv.verbose) {
    require('debug').enable('testmybot*,botium*')
  }
  if (argv.config) {
    testmybot.globals().configfile = argv.config
  }

  const emulator = testmybot.emulator.console()
  emulator()
}

module.exports = {
  command: 'emulator',
  describe: 'Launch Botium console emulator',
  handler
}
