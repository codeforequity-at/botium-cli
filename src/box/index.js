const util = require('util')
const yargsCmd = require('yargs')
const request = require('request')
const Mocha = require('mocha')
const _ = require('lodash')
const addContext = require('mochawesome/addContext')
const debug = require('debug')('botium-cli-box')
const { parseReporterOptions, parseReporter, outputTypes } = require('../run/index')

const handleArrayParam = (argv, paramName, envNameStart) => {
  argv[paramName] = argv[paramName] ? _.isArray(argv[paramName]) ? argv[paramName] : [argv[paramName]] : []
  const envParams = Object.keys(process.env).filter(e => e.startsWith(envNameStart)).map(e => process.env[e]).filter(e => e)
  if (envParams) {
    argv[paramName] = argv[paramName].concat(envParams)
  }
}

const buildBotiumCaps = (arg) => {
  return arg && arg.reduce((acc, c) => {
    const [key, val] = c.split('=')
    if (key && val) {
      acc[key] = val
    } else {
      acc[key] = true
    }
    return acc
  }, {})
}

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  const reporterOptions = parseReporterOptions(argv.reporterOptions)
  debug(`Mocha Reporter "${argv.output}", options: ${util.inspect(reporterOptions)}`)

  argv.webhook = process.env.BOTIUM_BOX_WEBHOOK || argv.webhook
  if (!argv.webhook) {
    return yargsCmd.showHelp()
  }

  argv.buildid = process.env.BOTIUM_BOX_BUILDID || argv.buildid
  argv.buildcomment = process.env.BOTIUM_BOX_BUILDCOMMENT || argv.buildcomment

  handleArrayParam(argv, 'tags', 'BOTIUM_BOX_TAGS')
  handleArrayParam(argv, 'caps', 'BOTIUM_BOX_CAPS')
  handleArrayParam(argv, 'sources', 'BOTIUM_BOX_SOURCES')
  handleArrayParam(argv, 'envs', 'BOTIUM_BOX_ENVS')

  const boxPostParams = {
    WAIT: '1',
    REPORTER: 'json'
  }
  if (argv.buildid) boxPostParams.BUILDID = argv.buildid
  if (argv.buildcomment) boxPostParams.BUILDCOMMENT = argv.buildcomment
  if (argv.tags) boxPostParams.TAG = argv.tags.map(t => `${t}`)
  if (argv.caps) boxPostParams.CAPS = buildBotiumCaps(argv.caps)
  if (argv.sources) boxPostParams.SOURCES = buildBotiumCaps(argv.sources)
  if (argv.envs) boxPostParams.ENVS = buildBotiumCaps(argv.envs)

  debug(`Botium Box calling ${argv.webhook} command options: ${util.inspect(boxPostParams)}`)
  request({
    uri: argv.webhook,
    method: 'POST',
    json: boxPostParams
  }, (err, response, body) => {
    if (err) {
      console.log(`ERROR: ${err}`)
      return process.exit(1)
    }
    if (!body || !body.id) {
      console.log(`ERROR: NO JSON RESPONSE ${util.inspect(body)}`)
      return process.exit(1)
    }
    debug(`Botium Box sent response: ${util.inspect(body)}`)

    const mocha = new Mocha({
      reporter: parseReporter(argv.output),
      reporterOptions
    })

    const suite = Mocha.Suite.create(mocha.suite, body.name)
    let runner = null

    if (!body.results || body.results.length === 0) {
      const test = new Mocha.Test(body.name, (testcaseDone) => {
        if (body.status === 'READY') {
          testcaseDone()
        } else {
          testcaseDone(`Botium Box returned status: ${body.status}`)
        }
      })
      suite.addTest(test)
    } else {
      body.results.forEach((result) => {
        const test = new Mocha.Test(result.testcaseName, (testcaseDone) => {
          if (result.testcaseSource) addContext(runner, { title: 'Conversation Log', value: result.testcaseSource })

          if (result.success) {
            testcaseDone()
          } else {
            testcaseDone(result.err || 'Botium Box returned error')
          }
        })
        suite.addTest(test)
      })
    }

    runner = mocha.run((failures) => {
      process.on('exit', () => {
        process.exit(failures)
      })
    })
  })
}

module.exports = {
  command: 'box [output]',
  describe: 'Run Test Project on Botium Box and output test report with Mocha test runner',
  builder: (yargs) => {
    yargs.positional('output', {
      describe: 'Output report type (select Mocha reporter)',
      choices: outputTypes,
      default: 'spec'
    })
    yargs.option('webhook', {
      describe: 'Botium Box Webhook Link for the Test Project, including the Botium Box API Key (also read from env variable "BOTIUM_BOX_WEBHOOK") (required)'
    })
    yargs.option('buildid', {
      describe: 'Botium Box Build Identifier for the Test Project Build (also read from env variable "BOTIUM_BOX_BUILDID")'
    })
    yargs.option('buildcomment', {
      describe: 'Botium Box Build Comment for Test Project Build (also read from env variable "BOTIUM_BOX_BUILDCOMMENT")'
    })
    yargs.option('tags', {
      describe: 'Botium Box Tags to attach to the Test Project, can be specified more than once, ending in "--" ("... --tags Tag1 Tag2 Tag3 -- ...") (also read from env variables starting with "BOTIUM_BOX_TAGS")',
      array: true
    })
    yargs.option('caps', {
      describe: 'Botium Capabilities to attach to the Test Project Build, in the form of "CAPABILITYNAME=CAPABILITYVALUE", can be specified more than once, ending in "--" ("... --caps CAP1=value1 CAP2=value2 -- ...") (also read from env variables starting with "BOTIUM_BOX_CAPS")',
      array: true
    })
    yargs.option('sources', {
      describe: 'Botium Sources to attach to the Test Project Build, in the form of "SOURCESNAME=SOURCESVALUE", can be specified more than once, ending in "--" ("... --sources SOURCE1=value1 SOURCE2=value2 -- ...") (also read from env variables starting with "BOTIUM_BOX_SOURCES")',
      array: true
    })
    yargs.option('envs', {
      describe: 'Botium Environment Variables to attach to the Test Project Build, in the form of "ENVNAME=ENVVALUE", can be specified more than once, ending in "--" ("... --envs ENV1=value1 ENV2=value2 -- ...") (also read from env variables starting with "BOTIUM_BOX_ENVS")',
      array: true
    })
    yargs.option('reporter-options', {
      describe: 'Options for mocha reporter, either as JSON, or as key-value pairs ("option1=value1,option2=value2,..."). For details see documentation of the used mocha reporter.'
    })
  },
  handler
}
