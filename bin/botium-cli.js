#!/usr/bin/env node
const yargsCmd = require('yargs')
// const Mocha = require('mocha')
const debug = require('debug')
// const path = require('path')

const outputTypes = [
  'tap',
  'json',
  'xunit',
  'spec',
  'list',
  'html'
]

yargsCmd.usage('Botium CLI\n\nUsage: $0 [options]') // eslint-disable-line
  .help('help').alias('help', 'h')
  .version('version', require('../package.json').version).alias('version', 'V')
  .command('run [output]', 'Run Botium convo files and output test report', (yargs) => {
    yargs.positional('output', {
      describe: 'Output report type, supported: ' + outputTypes.join(),
      default: 'spec'
    })
  }, (argv) => {
    handleOptions(argv)

    if (outputTypes.findIndex((o) => o === argv.output) < 0) {
      yargsCmd.showHelp()
    } else {
      // runTestsuite(argv)
      console.log('runTestsuite')
    }
  })
  .command('emulator', 'Launch Botium emulator', () => {}, (argv) => {
    handleOptions(argv)

    console.log('run emulator')
  })
  .option('verbose', {
    alias: 'v',
    describe: 'Enable verbose output',
    default: false
  })
  .option('convos', {
    alias: 'C',
    describe: 'Path to the directory holding your convo files',
    default: './spec/convo'
  })
  .option('config', {
    alias: 'c',
    describe: 'Path to the Botium configuration file (botium.config.json)',
    default: './botium.config.json'
  })
  .demandCommand()
  .argv

function handleOptions (argv) {
  if (argv.verbose) {
    debug.enable('botium*')
  }
/*
  if (argv.convos) {
    require('../src/globals').get().convodirs = [ argv.convos ]
  }
  if (argv.config) {
    require('../src/globals').get().configfile = argv.config
  }
*/
}
/*
function runTestsuite (argv) {
  const mocha = new Mocha({
    reporter: argv.output
  })
  mocha.addFile(path.resolve(__dirname, 'testmybot.spec.js'))

  mocha.run((failures) => {
    process.on('exit', () => {
      process.exit(failures)
    })
  })
}
*/
