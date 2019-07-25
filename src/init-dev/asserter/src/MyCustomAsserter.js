const utils = require('util')

module.exports = class MyCustomAsserter {
  constructor (context, caps, globalArgs) {
    this.context = context
    this.caps = caps
    this.globalArgs = globalArgs
    console.log(`MyCustomAsserter constructor, globalArgs: ${utils.inspect(globalArgs)}`)
  }

  assertConvoBegin ({ convo, args, isGlobal }) {
    console.log(`MyCustomAsserter assertConvoBegin: ${convo.header.name}`)
    return Promise.resolve()
  }

  assertConvoStep ({ convo, convoStep, args, isGlobal, botMsg }) {
    console.log(`MyCustomAsserter assertConvoStep ${convo.header.name}/${convoStep.stepTag}, args: ${utils.inspect(args)}, botMessage: ${botMsg.messageText}`)
    return Promise.resolve()
  }

  assertConvoEnd ({ convo, transcript, args, isGlobal }) {
    console.log(`MyCustomAsserter assertConvoEnd ${convo.header.name}, conversation length: ${transcript.steps.length} steps`)
    return Promise.resolve()
  }
}
