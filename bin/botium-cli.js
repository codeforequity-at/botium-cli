#!/usr/bin/env node
const yargsCmd = require('yargs')

yargsCmd.usage('Botium CLI\n\nUsage: $0 [options]') // eslint-disable-line
  .help('help').alias('help', 'h')
  .version('version', require('../package.json').version).alias('version', 'V')
  .command(require('../src/run'))
  .command(require('../src/emulator'))
  .option('verbose', {
    alias: 'v',
    describe: 'Enable verbose output',
    default: false
  })
  .option('config', {
    alias: 'c',
    describe: 'Path to the Botium configuration file',
    default: './botium.json'
  })
  .demandCommand()
  .argv
