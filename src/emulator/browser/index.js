const util = require('util')
const fs = require('fs')
const path = require('path')
const term = require('terminal-kit').terminal
const figlet = require('figlet')
const express = require('express')
const http = require('http')
const bodyParser = require('body-parser')
const opn = require('opn')
const readline = require('readline')
const slug = require('slug')
const mkdirp = require('mkdirp')
const BotDriver = require('botium-core').BotDriver
const debug = require('debug')('botium-cli-browser')

module.exports = (outputDir, idePort) => {
  const driver = new BotDriver()
  let container = null

  term.fullscreen(true)
  term.yellow(
    figlet.textSync('BOTIUM', { horizontalLayout: 'full' })
  )
  term('\n')
  term.yellow('Botium booting ...\n')

  const appIde = express()
  const server = http.createServer(appIde)

  const io = require('socket.io')(server)
  io.on('connection', (socket) => {
    socket.on('usersays', (msg) => {
      debug('received message ', msg)
      container.UserSays(msg).catch((err) => term.red(util.inspect(err)))
    })
  })

  server.listen(idePort, (err) => {
    if (err) {
      term.red('error listening ' + idePort + ': ' + err + '\n')
      process.exit(1)
    } else {
      driver.Build().then((c) => {
        container = c

        driver.on('MESSAGE_RECEIVEDFROMBOT', (container, msg) => {
          if (msg) {
            io.sockets.emit('botsays', msg)
          }
        })

        term.green('Botium Browser Emulator listening on port ' + idePort + '\n')
        term.green('Enter "#EXIT" to quit!\n')

        opn('http://127.0.0.1:' + idePort).catch((err) => term.yellow('Starting browser not possible (' + err + '), please connect manually (http://127.0.0.1:' + idePort + ')\n'))

        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          terminal: false
        })

        rl.on('line', (line) => {
          if (!line) return

          if (line.toLowerCase() === '#exit') {
            term.yellow('Botium stopping ...')
            container.Stop().then(() => container.Clean()).then(() => term.green('Botium stopped\n')).then(() => process.exit(0)).catch((err) => term.red(err + '\n'))
          }
        })
      }).catch((err) => term.red(JSON.stringify(err)))
    }
  })

  appIde.set('view engine', 'ejs')
  appIde.set('views', path.resolve(__dirname, 'views'))

  appIde.use(bodyParser.json())

  appIde.use('/public', express.static(path.resolve(__dirname, 'public')))

  appIde.use((req, res, next) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    res.header('Expires', '-1')
    res.header('Pragma', 'no-cache')
    next()
  })

  appIde.get('/', (req, res) => {
    debug('GET /')

    const data = {
      config: {
        Capabilities: driver.caps,
        Envs: driver.envs,
        Sources: driver.sources
      }
    }
    res.render('index', data)
  })

  const router = express.Router()

  router.route('/startcontainer')
    .post((req, res) => {
      debug('POST /startcontainer')
      container.Stop().then(() => container.Start()).then(() => {
        res.json({ success: true })
      }).catch((err) => {
        term.red('startcontainer error: ' + err + '\n')
        res.json({ success: false, error: err })
      })
    })

  router.route('/testcases')
    .post((req, res) => {
      debug('POST /testcases')

      if (!req.body.header || !req.body.header.name) {
        return res.json({ success: false, error: 'Name not specified' })
      }
      if (!req.body.conversation) {
        return res.json({ success: false, error: 'Conversation not specified' })
      }

      const filename = path.resolve(outputDir, slug(req.body.header.name) + '.convo.txt')
      try {
        fs.accessSync(filename, fs.constants.R_OK)
        return res.json({ success: false, error: 'File ' + filename + ' already exists. Please choose another conversation name.' })
      } catch (err) {
      }

      try {
        mkdirp.sync(outputDir)

        const compiler = driver.BuildCompiler()
        const scriptData = compiler.Decompile([req.body], 'SCRIPTING_FORMAT_TXT')
        fs.writeFileSync(filename, scriptData)
        term.green('Conversation written to file ' + filename + '\n')
        return res.json({ success: true, filename: filename })
      } catch (err) {
        term.red('writeConvo error: ' + err + '\n')
        return res.json({ success: false, error: err })
      }
    })
    .get((req, res) => {
      debug('GET /testcases')
      try {
        const compiler = driver.BuildCompiler()
        compiler.ReadScriptsFromDirectory(outputDir)
        return res.json(compiler.convos.map((convo) => Object.assign({}, convo, { provider: null })))
      } catch (err) {
        term.red('readConvos error: ' + err + '\n')
        return res.json({ success: false, error: err })
      }
    })

  router.route('/testcases/:filename')
    .get((req, res) => {
      debug('GET /testcases/' + req.params.filename)

      try {
        const compiler = driver.BuildCompiler()
        compiler.ReadScript(outputDir, req.params.filename)
        if (compiler.convos) {
          return res.json(Object.assign({}, compiler.convos[0], { provider: null }))
        } else {
          return res.json({ success: false, error: 'no convo found' })
        }
      } catch (err) {
        term.red('readConvo error: ' + err + '\n')
        return res.json({ success: false, error: err })
      }
    }).put((req, res) => {
      debug('PUT /testcases/' + req.params.filename)

      if (!req.body.header || !req.body.header.name) {
        return res.json({ success: false, error: 'Name not specified' })
      }
      if (!req.body.conversation) {
        return res.json({ success: false, error: 'Conversation not specified' })
      }

      const filename = path.resolve(outputDir, req.params.filename)

      try {
        const compiler = driver.BuildCompiler()
        const scriptData = compiler.Decompile([req.body], 'SCRIPTING_FORMAT_TXT')

        fs.writeFileSync(filename, scriptData)
        term.green('Conversation written to file ' + filename + '\n')
        return res.json({ success: true, filename: filename })
      } catch (err) {
        term.red('writeConvo error: ' + err + '\n')
        return res.json({ success: false, error: err })
      }
    })

  appIde.use('/api', router)
}
