const util = require('util')
const BotDriver = require('botium-core').BotDriver
const debug = require('debug')('botium-cli-hello')

const fgRed = '\x1b[31m'
const fgGreen = '\x1b[32m'

const handler = async (argv) => {
  debug(`command options: ${util.inspect(argv)}`)
  const driver = new BotDriver()
  const compiler = driver.BuildCompiler()
  const convo = {
    header: {
      name: 'Connectivity check'
    },
    conversation: []
  }

  try {
    const container = await _startContainer(driver)

    const userMessage = {
      sender: 'me',
      messageText: argv.messageText
    }
    convo.conversation.push(userMessage)
    await container.UserSays(userMessage)
    convo.conversation.push(await container.WaitBotSays())

    await _stopContainer(container)

    const script = compiler.Decompile([convo], 'SCRIPTING_FORMAT_TXT')
    console.log(`${script}-------------------------`)
    console.log(fgGreen, 'Connectivity check SUCCESS')
  } catch (err) {
    console.log(err.message || err)
    console.log(fgRed, 'Connectivity check FAILED')
    process.exit(1)
  }
}

const _startContainer = async (driver) => {
  const myContainer = await driver.Build()
  debug('Conversation container built, now starting')
  try {
    await myContainer.Start()
    debug('Conversation container started.')
    return myContainer
  } catch (err) {
    try {
      await myContainer.Stop()
    } catch (err) {
      debug(`Conversation Stop failed: ${err}`)
    }
    try {
      await myContainer.Clean()
    } catch (err) {
      debug(`Conversation Clean failed: ${err}`)
    }
    throw err
  }
}

const _stopContainer = async (container) => {
  if (container) {
    try {
      await container.Stop()
    } catch (err) {
      debug(`Conversation Stop failed: ${err}`)
    }
    try {
      await container.Clean()
    } catch (err) {
      debug(`Conversation Clean failed: ${err}`)
    }
  }
  debug('Conversation container stopped.')
}

module.exports = {
  command: 'hello',
  describe: 'Say "hello" to check connectivity with the configured chatbot.',
  builder: (yargs) => {
    yargs.option('messageText', {
      describe: 'The defined message text is sent to the bot.',
      default: 'hello'
    })
  },
  handler
}
