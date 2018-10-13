const util = require('util')
const fs = require('fs')
const path = require('path')
const term = require('terminal-kit').terminal
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
          term.cyan('BOT SAYS ' + (msg.channel ? '(' + msg.channel + '): ' : ': ') + msg.messageText + '\n')
        }
        if (msg.media && msg.media.length > 0) {
          term.cyan('BOT SENDS MEDIA ATTACHMENTS ' + (msg.channel ? '(' + msg.channel + '): ' : ': ') + '\n')
          msg.media.forEach(m => {
            term.cyan(' * URL: ' + m.mediaUri)
            m.mimeType && term.cyan(' MIMETYPE: ' + m.mimeType)
            m.altText && term.cyan(' ALTTEXT: ' + m.altText)
            term('\n')
          })
        }
        if (msg.buttons && msg.buttons.length > 0) {
          term.cyan('BOT SENDS BUTTONS ' + (msg.channel ? '(' + msg.channel + '): ' : ': ') + '\n')
          msg.buttons.forEach(b => {
            term.cyan(' * TEXT: ' + b.text)
            b.payload && term.cyan(' PAYLOAD: ' + b.payload)
            term('\n')
          })
        }
        if (msg.cards && msg.cards.length > 0) {
          term.cyan('BOT SENDS CARDS ' + (msg.channel ? '(' + msg.channel + '): ' : ': ') + '\n')
          msg.cards.forEach(c => {
            term.cyan(' ***********************************************\n')
            c.text && term.cyan(' * ' + c.text + '\n')
            c.image && term.cyan(' * IMAGE: ' + c.image.mediaUri + '\n')
            if (c.buttons && c.buttons.length > 0) {
              term.cyan(' ***********************************************\n')
              c.buttons.forEach(b => {
                term.cyan(' * BUTTON: ' + b.text)
                b.payload && term.cyan(' PAYLOAD: ' + b.payload)
                term('\n')
              })
            }
            term.cyan(' ***********************************************\n')
          })
        }

        if (!msg.messageText && !msg.media && !msg.buttons && !msg.cards && msg.sourceData) {
          term.cyan('BOT SAYS RICH MESSAGE ' + (msg.channel ? '(' + msg.channel + '): ' : ': \n'))
          term.cyan(JSON.stringify(msg.sourceData, null, 2))
          term('\n')
        }
        conversation.push(msg)
      }
    })

    term.fullscreen(true)
    term.yellow(
      figlet.textSync('BOTIUM', { horizontalLayout: 'full' })
    )
    term('\n')
    const helpText = 'Enter "#SAVE <conversation name>" to save your conversation into your convo-directory, #EXIT to quit or just a message to send to your Chatbot!\n'

    term.green('Chatbot online.\n')
    term.green(helpText)

    const evaluator = (line) => {
      if (line) line = line.trim()
      if (!line) return

      if (line.toLowerCase() === '#exit') {
        term.yellow('Botium stopping ...\n')
        container.Stop().then(() => container.Clean()).then(() => term.green('Botium stopped')).then(() => process.exit(0)).catch((err) => term.red(err))
      } else if (line.toLowerCase().startsWith('#save')) {
        const name = line.substr(5).trim()
        if (!name) {
          term.red(helpText)
          return
        }
        const filename = path.resolve(outputDir, slug(name) + '.convo.txt')

        try {
          fs.accessSync(filename, fs.constants.R_OK)
          term.red('File ' + filename + ' already exists. Please choose another conversation name.\n')
          return
        } catch (err) {
        }

        try {
          mkdirp.sync(outputDir)

          const scriptData = compiler.Decompile([ { header: { name }, conversation } ], 'SCRIPTING_FORMAT_TXT')
          fs.writeFileSync(filename, scriptData)
          term.green('Conversation written to file ' + filename + '\n')
          conversation.length = 0
        } catch (err) {
          term.red(err)
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
  }).catch((err) => term.red(util.inspect(err)))
}
