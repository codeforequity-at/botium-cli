const util = require('util')
const yargsCmd = require('yargs')
const path = require('path')
const fs = require('fs-extra')
const debug = require('debug')('botium-cli-emulator')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  if (!argv.project) {
    return yargsCmd.showHelp()
  }
  const srcPath = path.resolve(__dirname, argv.project)
  const targetPath = path.resolve(process.cwd())
  fs.copySync(srcPath, targetPath)
  console.log(`Botium development project written to "${targetPath}". You should now run "botium-cli run --verbose --convos spec/convos" to verify.`)
}

module.exports = {
  command: 'init-dev [project]',
  describe: 'Setup a development project for Botium connectors, asserters or logic hooks in the current directory',
  builder: (yargs) => {
    yargs.positional('project', {
      describe: 'Project type',
      choices: ['connector', 'asserter', 'logichook'],
      default: 'asserter'
    })
  },
  handler
}
