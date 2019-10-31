const util = require('util')
const yargsCmd = require('yargs')
const debug = require('debug')('botium-cli-emulator')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  if (!argv.ui) {
    return yargsCmd.showHelp()
  }

  if (argv.ui === 'console') {
    const emulator = require('./console')
    emulator(argv.convos[0])
  } else {
    return yargsCmd.showHelp()
  }
}

module.exports = {
  command: 'emulator [ui]',
  describe: 'Launch Botium emulator',
  builder: (yargs) => {
    yargs.positional('ui', {
      describe: 'Emulator UI (terminal-based)',
      choices: ['console'],
      default: 'console'
    })
  },
  handler
}
