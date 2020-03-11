const util = require('util')
const path = require('path')
const fs = require('fs')
const Mocha = require('mocha')
const isJSON = require('is-json')
const slug = require('slug')
const mime = require('mime-types')
const BotDriver = require('botium-core').BotDriver
const expect = require('chai').expect
const addContext = require('mochawesome/addContext')
const debug = require('debug')('botium-cli-run')

const outputTypes = [
  'dot',
  'nyan',
  'landing',
  'tap',
  'json',
  'json-stream',
  'xunit',
  'spec',
  'list',
  'min',
  'doc',
  'progress',
  'csv',
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

const parseReporter = (output) => {
  return output === 'csv' ? CsvReporter : output
}

class CsvReporter {
  constructor (runner) {
    Mocha.reporters.Base.call(this, runner)

    const quote = (str) => str ? str.replace('"', '""') : ''

    runner.on('start', function () {
      console.log('STATUS,SUITE,TEST,DURATION,MESSAGE')
    })

    runner.on('pass', function (test) {
      console.log(`"OK","${quote(test.parent && test.parent.title)}","${quote(test.title)}",${test.duration},""`)
    })

    runner.on('fail', function (test, err) {
      console.log(`"NOK","${quote(test.parent && test.parent.title)}","${quote(test.title)}",${test.duration},"${quote(err.message)}"`)
    })
  }
}

const wrapBotiumError = (err) => {
  if (err.cause && err.cause.prettify) {
    return new Error(err.message + '\r\n' + err.cause.prettify())
  } else {
    return new Error(err.message)
  }
}

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  const reporterOptions = parseReporterOptions(argv.reporterOptions)
  debug(`Mocha Reporter "${argv.output}", options: ${util.inspect(reporterOptions)}`)

  argv.testsuitename = process.env.BOTIUM_TESTSUITENAME || argv.testsuitename
  argv.timeout = process.env.BOTIUM_TIMEOUT || argv.timeout
  argv.timeout = argv.timeout * 1000
  argv.attachments = process.env.BOTIUM_ATTACHMENTS || argv.attachments

  const driver = new BotDriver()
  const compiler = driver.BuildCompiler()
  compiler.scriptingEvents.fail = (err) => {
    expect.fail(null, null, err)
  }
  argv.convos.forEach((convodir) => {
    compiler.ReadScriptsFromDirectory(convodir, process.env.BOTIUM_FILTER || argv.filter)
  })
  debug(`ready reading convos (${compiler.convos.length}), expanding convos ...`)
  if (process.env.BOTIUM_EXPANDUTTERANCES === '1' || argv.expandutterances) {
    debug('expanding utterances ...')
    compiler.ExpandUtterancesToConvos()
  }
  if (process.env.BOTIUM_EXPANDSCRIPTINGMEMORY === '1' || argv.expandscriptingmemory) {
    debug('expanding scripting memory ...')
    compiler.ExpandScriptingMemoryToConvos()
  }
  compiler.ExpandConvos()

  debug(`ready expanding convos and utterances, number of test cases: (${compiler.convos.length}).`)

  const mocha = new Mocha({
    reporter: parseReporter(argv.output),
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
      const attachmentsLog = []
      const listenerMe = (container, msg) => {
        messageLog.push('#me: ' + msg.messageText)
        if (msg.attachments) attachmentsLog.push(...msg.attachments)
      }
      const listenerBot = (container, msg) => {
        messageLog.push('#bot: ' + msg.messageText)
        if (msg.attachments) attachmentsLog.push(...msg.attachments)
      }
      const listenerAttachments = (container, attachment) => {
        attachmentsLog.push(attachment)
      }
      driver.on('MESSAGE_SENTTOBOT', listenerMe)
      driver.on('MESSAGE_RECEIVEDFROMBOT', listenerBot)
      driver.on('MESSAGE_ATTACHMENT', listenerAttachments)

      const finish = (err) => {
        addContext(runner, { title: 'Conversation Log', value: messageLog.join('\n') })
        driver.eventEmitter.removeListener('MESSAGE_SENTTOBOT', listenerMe)
        driver.eventEmitter.removeListener('MESSAGE_RECEIVEDFROMBOT', listenerBot)
        driver.eventEmitter.removeListener('MESSAGE_ATTACHMENT', listenerAttachments)

        if (argv.attachments && attachmentsLog.length > 0) {
          debug(`Found ${attachmentsLog.length} attachments, saving to folder ${argv.attachments}`)
          attachmentsLog.forEach((a, i) => {
            const filename = slug(convo.header.name) + '_' + i + (a.name ? '_' + slug(a.name) : '') + (a.mimeType ? '.' + mime.extension(a.mimeType) : '')
            const outputTo = path.join(argv.attachments, filename)
            try {
              fs.writeFileSync(outputTo, Buffer.from(a.base64, 'base64'))
            } catch (err) {
              debug(`Failed to write attachment to ${outputTo}: ${err.message || util.inspect(err)}`)
            }
          })
        }
        if (err) {
          testcaseDone(wrapBotiumError(err))
        } else {
          testcaseDone()
        }
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
    yargs.option('expandscriptingmemory', {
      describe: 'Expand scripting memory tables to separate convos (also read from env variable "BOTIUM_EXPANDSCRIPTINGMEMORY" - "1" means yes)',
      default: false
    })
    yargs.option('attachments', {
      describe: 'Directory where to save message attachments, for example screenshots from webdriver (also read from env variable "BOTIUM_ATTACHMENTS")'
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
  parseReporter,
  outputTypes
}
