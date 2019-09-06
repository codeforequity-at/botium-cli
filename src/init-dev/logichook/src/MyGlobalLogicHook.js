const utils = require('util')

/**
 * This is a custom global logic hook
 * The hook functions are evaluated for all convos
 */
module.exports = class MyGlobalLogicHook {
  constructor (context, caps, globalArgs) {
    this.context = context
    this.caps = caps
    this.globalArgs = globalArgs
    console.log(`MyGlobalLogicHook constructor, globalArgs: ${utils.inspect(globalArgs)}`)
  }

  onConvoBegin ({ convo, args }) {
    console.log(`MyGlobalLogicHook onConvoBegin: ${convo.header.name}`)
  }

  onConvoEnd ({ convo, transcript, args }) {
    console.log(`MyGlobalLogicHook onConvoEnd ${convo.header.name}, conversation length: ${transcript.steps.length} steps`)
  }

  onMeStart ({ convo, convoStep, args }) {
    console.log(`MyGlobalLogicHook onMeStart ${convo.header.name}/${convoStep.stepTag}, args: ${utils.inspect(args)}, meMessage: ${convoStep.messageText}`)
  }

  onMeEnd ({ convo, convoStep, args }) {
    console.log(`MyGlobalLogicHook onMeEnd ${convo.header.name}/${convoStep.stepTag}, args: ${utils.inspect(args)}, meMessage: ${convoStep.messageText}`)
  }

  onBotStart ({ convo, convoStep, args }) {
    console.log(`MyGlobalLogicHook onBotStart ${convo.header.name}/${convoStep.stepTag}, args: ${utils.inspect(args)}, expected: ${convoStep.messageText}`)
  }

  onBotEnd ({ convo, convoStep, botMsg, args }) {
    console.log(`MyGlobalLogicHook onBotEnd ${convo.header.name}/${convoStep.stepTag}, args: ${utils.inspect(args)}, expected: ${convoStep.messageText}, meMessage: ${botMsg.messageText}`)
  }
}
