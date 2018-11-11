const util = require('util')
const path = require('path')
const Mocha = require('mocha')
const isJSON = require('is-json')
const debug = require('debug')('botium-cli-run')

const outputTypes = [
  'tap',
  'json',
  'xunit',
  'spec',
  'list',
  'mochawesome'
]

const parseReporterOptions = (args) => {
  if (!args) return

  if (isJSON(args)) {
    return JSON.parse(args)
  }

  return args.split(',').reduce((acc, option) => {
    if (option.indexOf('=') > 0) {
      const [key, value] = option.split('=')
      acc[key] = value
    } else {
      acc[option] = true
    }
    return acc
  }, {})
}

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  const reporterOptions = parseReporterOptions(argv.reporterOptions)
  debug(`Mocha Reporter "${argv.output}", options: ${util.inspect(reporterOptions)}`)

  argv.testsuitename = process.env.BOTIUM_TESTSUITENAME || argv.testsuitename
  argv.timeout = process.env.BOTIUM_TIMEOUT || argv.timeout
  argv.timeout = argv.timeout * 1000

  global.convos = argv.convos
  global.testsuitename = argv.testsuitename
  global.timeout = argv.timeout

  const mocha = new Mocha({
    reporter: argv.output,
    reporterOptions
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
      describe: 'Options for mocha reporter, either as JSON, or as key-value pairs ("option1=value1,option2=value2,..."). For details see documentation of the used mocha reporter.'
    })
  },
  handler
}
