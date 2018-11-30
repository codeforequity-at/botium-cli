const util = require('util')
const Mocha = require('mocha')
const isJSON = require('is-json')
const BotDriver = require('botium-core').BotDriver
const expect = require('chai').expect
const addContext = require('mochawesome/addContext')
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

  const driver = new BotDriver()
  const compiler = driver.BuildCompiler()
  compiler.scriptingEvents.fail = (err) => {
    expect.fail(null, null, err)
  }
  argv.convos.forEach((convodir) => {
    compiler.ReadScriptsFromDirectory(convodir, process.env.BOTIUM_FILTER || argv.filter)
  })
  debug(`ready reading convos (${compiler.convos.length}), expanding convos ...`)
  compiler.ExpandConvos()
  if (process.env.BOTIUM_EXPANDUTTERANCES === '1' || argv.expandutterances) {
    debug(`ready expanding convos (${compiler.convos.length}), expanding utterances ...`)
    compiler.ExpandUtterancesToConvos()
  }
  debug(`ready expanding convos and utterances, number of test cases: (${compiler.convos.length}).`)

  const mocha = new Mocha({
    reporter: argv.output,
    reporterOptions
  })

  const suite = Mocha.Suite.create(mocha.suite, process.env.BOTIUM_TESTSUITENAME || argv.testsuitename)
  suite.timeout(argv.timeout)
  suite.beforeAll((done) => {
    driver.Build()
      .then((container) => {
        suite.container = container
        done()
      })
      .catch(done)
  })
  suite.beforeEach((done) => {
    suite.container ? suite.container.Start().then(() => done()).catch(done) : done()
  })
  suite.afterEach((done) => {
    suite.container ? suite.container.Stop().then(() => done()).catch(done) : done()
  })
  suite.afterAll((done) => {
    suite.container ? suite.container.Clean().then(() => done()).catch(done) : done()
  })

  let runner = null

  compiler.convos.forEach((convo) => {
    debug(`adding test case ${convo.header.name} (from: ${util.inspect(convo.sourceTag)})`)
    const test = new Mocha.Test(convo.header.name, (testcaseDone) => {
      debug('running testcase ' + convo.header.name)

      const messageLog = []
      const listenerMe = (container, msg) => {
        messageLog.push('#me: ' + msg.messageText)
      }
      const listenerBot = (container, msg) => {
        messageLog.push('#bot: ' + msg.messageText)
      }
      driver.on('MESSAGE_SENTTOBOT', listenerMe)
      driver.on('MESSAGE_RECEIVEDFROMBOT', listenerBot)

      const finish = (err) => {
        addContext(runner, { title: 'Conversation Log', value: messageLog.join('\n') })
        driver.eventEmitter.removeListener('MESSAGE_SENTTOBOT', listenerMe)
        driver.eventEmitter.removeListener('MESSAGE_RECEIVEDFROMBOT', listenerBot)

        testcaseDone(err)
      }

      convo.Run(suite.container)
        .then(() => {
          debug(convo.header.name + ' ready, calling done function.')
          finish()
        })
        .catch((err) => {
          debug(convo.header.name + ' failed: ' + util.inspect(err))
          finish(err)
        })
    })
    test.timeout(argv.timeout)
    suite.addTest(test)
  })

  runner = mocha.run((failures) => {
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
    yargs.option('filter', {
      describe: 'Filter the convo files to run with a "glob" filter (also read from env variable "BOTIUM_FILTER"), for example "**/*.en.*.txt"'
    })
    yargs.option('expandutterances', {
      describe: 'Expand all utterances (except INCOMPREHENSION) to simple Question/Answer convos (also read from env variable "BOTIUM_EXPANDUTTERANCES" - "1" means yes)',
      default: false
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
  handler,
  parseReporterOptions,
  outputTypes
}
