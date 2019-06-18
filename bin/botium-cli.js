#!/usr/bin/env node
const yargsCmd = require('yargs')
const _ = require('lodash')
const debug = require('debug')('botium-cli')

const handleConfig = (argv) => {
  argv.verbose = argv.v = process.env.BOTIUM_VERBOSE === '1' || argv.verbose

  if (argv.verbose) {
    require('debug').enable('botium*')
  }

  if (!process.env.BOTIUM_CONFIG) {
    process.env.BOTIUM_CONFIG = argv.config
  }
  debug(`Using Botium configuration file ${process.env.BOTIUM_CONFIG}`)

  const envConvoDirs = Object.keys(process.env).filter(e => e.startsWith('BOTIUM_CONVOS')).map(e => process.env[e]).filter(e => e)
  if (envConvoDirs && envConvoDirs.length > 0) {
    argv.convos = envConvoDirs
  } else {
    if (argv.convos && _.isString(argv.convos)) {
      argv.convos = [ argv.convos ]
    }
  }

  return true
}

const wrapHandler = (builder) => {
  const origHandler = builder.handler
  builder.handler = (argv) => {
    if (handleConfig(argv)) {
      origHandler(argv)
    }
  }
  return builder
}

yargsCmd.usage('Botium CLI\n\nUsage: $0 [options]') // eslint-disable-line
  .help('help').alias('help', 'h')
  .version('version', require('../package.json').version).alias('version', 'V')
  .showHelpOnFail(true)
  .strict(true)
  .demandCommand(1, 'You need at least one command before moving on')
  .command(wrapHandler(require('../src/run')))
  .command(wrapHandler(require('botium-connector-dialogflow/src/dialogflowintents').args))
  .command(wrapHandler(require('botium-connector-watson/src/watsonintents').args))
  .command(wrapHandler(require('../src/emulator')))
  .command(wrapHandler(require('../src/box')))
  .command(wrapHandler(require('../src/init')))
  .command(wrapHandler(require('../src/init-alexa-avs')))
  .command(require('../src/agent'))
  .option('verbose', {
    alias: 'v',
    describe: 'Enable verbose output (also read from env variable "BOTIUM_VERBOSE" - "1" means verbose)',
    default: false
  })
  .option('convos', {
    alias: 'C',
    describe: 'Path to a directory holding your convo files. Can be specified more than once, ending in "--" ("... --convos dir1 dir2 dir3 -- ...") (also read from env variables starting with "BOTIUM_CONVOS")',
    array: true,
    default: '.'
  })
  .option('config', {
    alias: 'c',
    envPrefix: 'BOTIUM_CONFIG',
    describe: 'Path to the Botium configuration file (also read from env variable "BOTIUM_CONFIG")',
    nargs: 1,
    default: './botium.json'
  })
  .argv
