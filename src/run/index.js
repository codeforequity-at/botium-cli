const util = require('util')
const path = require('path')
const Mocha = require('mocha')
const debug = require('debug')('botium-cli-run')

const outputTypes = [
  'tap',
  'json',
  'xunit',
  'spec',
  'list',
  'mochawesome'
]

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  argv.testsuitename = process.env.BOTIUM_TESTSUITENAME || argv.testsuitename
  argv.timeout = process.env.BOTIUM_TIMEOUT || argv.timeout
  argv.timeout = argv.timeout * 1000

  global.convos = argv.convos
  global.testsuitename = argv.testsuitename
  global.timeout = argv.timeout

  const mocha = new Mocha({
    reporter: argv.output,
    reporterOptions: argv.reporterOptions
  })
  mocha.addFile(path.resolve(__dirname, 'mocha.spec.js'))

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
    yargs.option('testsuitename', {
      alias: 'n',
      describe: 'Name of the Test Suite (also read from env variable "BOTIUM_TESTSUITENAME")',
      default: 'Botium Test-Suite'
    })
    yargs.option('timeout', {
      describe: 'Timeout in seconds for Botium functions (also read from env variable "BOTIUM_TIMEOUT")',
      number: true,
      default: 60
    })
    yargs.option('reporter-options', {
      describe: 'Options for mocha reporter, forwared as-is'
    })
  },
  handler
}
