const utils = require('util')

/**
 * This is a custom logic hook
 * It has to be referenced in the convo file to get active
 */
module.exports = class MyCustomLogicHook {
  constructor (context, caps, globalArgs) {
    this.context = context
    this.caps = caps
    this.globalArgs = globalArgs
    console.log(`MyCustomLogicHook constructor, globalArgs: ${utils.inspect(globalArgs)}`)
  }

  onConvoBegin ({ convo, args }) {
    console.log(`MyCustomLogicHook onConvoBegin: ${convo.header.name}`)
  }

  onConvoEnd ({ convo, transcript, args }) {
    console.log(`MyCustomLogicHook onConvoEnd ${convo.header.name}, conversation length: ${transcript.steps.length} steps`)
  }

  onMeStart ({ convo, convoStep, args }) {
    console.log(`MyCustomLogicHook onMeStart ${convo.header.name}/${convoStep.stepTag}, args: ${utils.inspect(args)}, meMessage: ${convoStep.messageText}`)
  }

  onMeEnd ({ convo, convoStep, args }) {
    console.log(`MyCustomLogicHook onMeEnd ${convo.header.name}/${convoStep.stepTag}, args: ${utils.inspect(args)}, meMessage: ${convoStep.messageText}`)
  }

  onBotStart ({ convo, convoStep, args }) {
    console.log(`MyCustomLogicHook onBotStart ${convo.header.name}/${convoStep.stepTag}, args: ${utils.inspect(args)}, expected: ${convoStep.messageText}`)
  }

  onBotEnd ({ convo, convoStep, botMsg, args }) {
    console.log(`MyCustomLogicHook onBotEnd ${convo.header.name}/${convoStep.stepTag}, args: ${utils.inspect(args)}, expected: ${convoStep.messageText}, meMessage: ${botMsg.messageText}`)
  }
}
