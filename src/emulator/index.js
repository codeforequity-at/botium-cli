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
  } else if (argv.ui === 'browser') {
    const emulator = require('./browser')
    emulator(argv.convos[0], argv.emulatorport)
  } else {
    return yargsCmd.showHelp()
  }
}

module.exports = {
  command: 'emulator [ui]',
  describe: 'Launch Botium emulator',
  builder: (yargs) => {
    yargs.positional('ui', {
      describe: 'Emulator UI (terminal-based or webbrowser-based)',
      choices: ['console', 'browser'],
      default: 'console'
    })
    yargs.option('emulatorport', {
      describe: 'Local port the browser emulator is listening to',
      number: true,
      default: 3000
    })
  },
  handler
}
