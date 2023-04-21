const util = require('util')
const fs = require('fs')
const path = require('path')
const { mkdirpSync } = require('mkdirp')
const debug = require('debug')('botium-bindings-cli')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  const botiumConvoDir = argv.convos[0]
  if (!fs.existsSync(botiumConvoDir)) {
    mkdirpSync(botiumConvoDir)
  }

  const botiumJsonFile = argv.config
  if (fs.existsSync(botiumJsonFile)) {
    console.log(`Botium Configuration File "${botiumJsonFile}" already present, skipping ...`)
  } else {
    fs.writeFileSync(botiumJsonFile, JSON.stringify({
      botium: {
        Capabilities: {
          PROJECTNAME: 'My Botium Project',
          CONTAINERMODE: 'echo'
        },
        Sources: { },
        Envs: { }
      }
    }, null, 2))
    console.log(`Botium Configuration File written to "${botiumJsonFile}".`)
  }

  const botiumEchoSample = path.resolve(botiumConvoDir, 'give_me_a_picture.convo.txt')
  if (fs.existsSync(botiumEchoSample)) {
    console.log(`Botium Convo File "${botiumEchoSample}" already present, skipping ...`)
  } else {
    fs.writeFileSync(botiumEchoSample,
      `give me picture

#me
Hello, Bot!

#bot
You said: Hello, Bot!

#me
give me a picture

#bot
Here is a picture
MEDIA logo.png
`
    )
    console.log(`Botium Convo File written to "${botiumEchoSample}".`)
  }
  console.log(`Botium initialization ready. You should now run "botium-cli run --verbose --convos ${botiumConvoDir}" to verify.`)
}

module.exports = {
  command: 'init',
  describe: 'Setup a directory for Botium usage',
  handler
}
