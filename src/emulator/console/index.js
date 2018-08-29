const util = require('util')
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const clear = require('clear')
const mkdirp = require('mkdirp')
const figlet = require('figlet')
const repl = require('repl')
const slug = require('slug')
const BotDriver = require('botium-core').BotDriver

module.exports = (outputDir) => {
  const driver = new BotDriver()
  const compiler = driver.BuildCompiler()
  let container = null

  driver.Build().then((c) => {
    container = c
    return container.Start()
  }).then(() => {
    const conversation = []

    driver.on('MESSAGE_RECEIVEDFROMBOT', (container, msg) => {
      if (msg) {
        if (!msg.sender) msg.sender = 'bot'
        if (msg.messageText) {
          console.log(chalk.blue('BOT SAYS ' + (msg.channel ? '(' + msg.channel + '): ' : ': ') + msg.messageText))
        } else if (msg.sourceData && msg.sourceData.message) {
          console.log(chalk.blue('BOT SAYS ' + (msg.channel ? '(' + msg.channel + '): ' : ': ')))
          console.log(chalk.blue(JSON.stringify(msg.sourceData.message, null, 2)))
        }
        conversation.push(msg)
      }
    })

    clear()
    console.log(
      chalk.yellow(
        figlet.textSync('BOTIUM', { horizontalLayout: 'full' })
      )
    )
    const helpText = 'Enter "#SAVE <conversation name>" to save your conversation into your convo-directory, #EXIT to quit or just a message to send to your Chatbot!'

    console.log(chalk.green('Chatbot online.'))
    console.log(chalk.green(helpText))

    const evaluator = (line) => {
      if (line) line = line.trim()
      if (!line) return

      if (line.toLowerCase() === '#exit') {
        console.log(chalk.yellow('Botium stopping ...'))
        container.Stop().then(() => container.Clean()).then(() => console.log(chalk.green('Botium stopped'))).then(() => process.exit(0)).catch((err) => console.log(chalk.red(err)))
      } else if (line.toLowerCase().startsWith('#save')) {
        const name = line.substr(5).trim()
        if (!name) {
          console.log(chalk.red(helpText))
          return
        }
        const filename = path.resolve(outputDir, slug(name) + '.convo.txt')

        try {
          fs.accessSync(filename, fs.constants.R_OK)
          console.log(chalk.red('File ' + filename + ' already exists. Please choose another conversation name.'))
          return
        } catch (err) {
        }

        try {
          mkdirp.sync(outputDir)

          const scriptData = compiler.Decompile([ { header: { name }, conversation } ], 'SCRIPTING_FORMAT_TXT')
          fs.writeFileSync(filename, scriptData)
          console.log(chalk.green('Conversation written to file ' + filename))
          conversation.length = 0
        } catch (err) {
          console.log(chalk.red(err))
        }
      } else if (line.startsWith('#')) {
        const channel = line.substr(0, line.indexOf(' '))
        const text = line.substr(line.indexOf(' ') + 1)

        const msg = { messageText: text, sender: 'me', channel: channel }

        container.UserSays(msg)
        conversation.push(msg)
      } else {
        const msg = { messageText: line, sender: 'me' }

        container.UserSays(msg)
        conversation.push(msg)
      }
    }
    repl.start({prompt: '', eval: evaluator})
  }).catch((err) => console.log(chalk.red(util.inspect(err))))
}
