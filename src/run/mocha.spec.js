/* global describe it before beforeEach after afterEach */

const util = require('util')
const expect = require('chai').expect
const addContext = require('mochawesome/addContext')
const botium = require('botium-core')
const debug = require('debug')('botium-cli-mocha-spec')

describe(global.testsuitename, () => {
  const botiumContext = {
    driver: new botium.BotDriver()
      .setCapabilities(global.configJson.botium.Capabilities)
      .setEnvs(global.configJson.botium.Envs)
      .setSources(global.configJson.botium.Sources),
    compiler: null,
    container: null
  }
  botiumContext.compiler = botiumContext.driver.BuildCompiler()
  botiumContext.compiler.scriptingEvents.fail = (err) => {
    expect.fail(null, null, err)
  }

  before(function (done) {
    this.timeout(global.timeout)
    botiumContext.driver.Build()
      .then((c) => {
        botiumContext.container = c
        done()
      }).catch(done)
  })
  beforeEach(function (done) {
    this.timeout(global.timeout)
    botiumContext.container.Start().then(() => done()).catch(done)
  })
  afterEach(function (done) {
    this.timeout(global.timeout)
    botiumContext.container.Stop().then(() => done()).catch(done)
  })
  after(function (done) {
    this.timeout(global.timeout)
    botiumContext.container.Clean().then(() => done()).catch(done)
  })

  global.convos.forEach((convodir) => {
    botiumContext.compiler.ReadScriptsFromDirectory(convodir)
  })
  debug(`ready reading convos (${botiumContext.compiler.convos.length}), expanding utterances ...`)
  botiumContext.compiler.ExpandConvos()
  debug(`ready expanding utterances, number of test cases: (${botiumContext.compiler.convos.length}).`)

  botiumContext.compiler.convos.forEach((convo) => {
    debug('adding test case ' + convo.header.name + ' (file: ' + convo.filename + ')')

    it(convo.header.name, function (testcaseDone) {
      debug('running testcase ' + convo.header.name)

      const messageLog = []
      const listenerMe = (container, msg) => {
        messageLog.push('#me: ' + msg.messageText)
      }
      const listenerBot = (container, msg) => {
        messageLog.push('#bot: ' + msg.messageText)
      }
      botiumContext.driver.on('MESSAGE_SENTTOBOT', listenerMe)
      botiumContext.driver.on('MESSAGE_RECEIVEDFROMBOT', listenerBot)

      const finish = (err) => {
        addContext(this, { title: 'Conversation Log', value: messageLog.join('\n') })
        botiumContext.driver.eventEmitter.removeListener('MESSAGE_SENTTOBOT', listenerMe)
        botiumContext.driver.eventEmitter.removeListener('MESSAGE_RECEIVEDFROMBOT', listenerBot)

        testcaseDone(err)
      }

      convo.Run(botiumContext.container)
        .then(() => {
          debug(convo.header.name + ' ready, calling done function.')
          finish()
        })
        .catch((err) => {
          debug(convo.header.name + ' failed: ' + util.inspect(err))
          finish(err)
        })
    }).timeout(global.timeout)
  })
})
