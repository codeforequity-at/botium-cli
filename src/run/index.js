const util = require('util')
const path = require('path')
const Mocha = require('mocha')
const _ = require('lodash')
const debug = require('debug')('botium-cli-run')

const testmybot = require('testmybot')

const outputTypes = [
  'tap',
  'json',
  'xunit',
  'spec',
  'list',
  'html',
  'mochawesome'
]

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  if (argv.verbose) {
    require('debug').enable('testmybot*,botium*')
  }
  if (argv.config) {
    testmybot.globals().configfile = argv.config
  }
  if (argv.convos) {
    if (!_.isArray(argv.convos)) argv.convos = [ argv.convos ]
    testmybot.globals().convodirs = argv.convos
  }

  const mocha = new Mocha({
    reporter: argv.output,
    reporterOptions: argv.reporterOptions
  })
  mocha.addFile(path.resolve(__dirname, 'testmybot.spec.js'))

  mocha.run((failures) => {
    process.on('exit', () => {
      process.exit(failures)
    })
  })
}

module.exports = {
  command: 'run [output]',
  describe: 'Run Botium convo files and output test report with Mocha test runner',
  builder: (yargs) => {
    yargs.positional('output', {
      describe: 'Output report type (select Mocha reporter)',
      choices: outputTypes,
      default: 'spec'
    })
    yargs.option('convos', {
      alias: 'C',
      describe: 'Path to a directory holding your convo files (can be specified more than once)',
      default: '.'
    })
    yargs.option('reporter-options', {
      describe: 'Options for mocha reporter, forwared as-is'
    })
  },
  handler
}
