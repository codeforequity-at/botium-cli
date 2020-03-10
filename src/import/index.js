#!/usr/bin/env node
const slug = require('slug')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const { BotDriver } = require('botium-core')

const writeConvo = (compiler, convo, outputDir) => {
  const filename = path.resolve(outputDir, slug(convo.header.name) + '.convo.txt')

  mkdirp.sync(outputDir)

  const scriptData = compiler.Decompile([convo], 'SCRIPTING_FORMAT_TXT')

  fs.writeFileSync(filename, scriptData)
  return filename
}

const writeUtterances = (compiler, utterance, samples, outputDir) => {
  const filename = path.resolve(outputDir, slug(utterance) + '.utterances.txt')

  mkdirp.sync(outputDir)

  const scriptData = [utterance, ...samples].join('\n')

  fs.writeFileSync(filename, scriptData)
  return filename
}

module.exports = (connector, command, describe) => {
  const { Handler, Args } = require(connector).Import

  return {
    command,
    describe,
    builder: (yargs) => {
      for (const arg of Object.keys(Args)) {
        if (Args[arg].skipCli) continue
        yargs.option(arg, Args[arg])
      }
    },
    handler: async (argv) => {
      const outputDir = argv.convos[0]

      let convos = []
      let utterances = []
      try {
        ({ convos, utterances } = await Handler(argv))
      } catch (err) {
        console.log(`FAILED: ${err.message}`)
        return
      }

      const driver = new BotDriver()
      const compiler = await driver.BuildCompiler()

      for (const convo of convos) {
        try {
          const filename = writeConvo(compiler, convo, outputDir)
          console.log(`SUCCESS: wrote convo to file ${filename}`)
        } catch (err) {
          console.log(`WARNING: writing convo "${convo.header.name}" failed: ${err.message}`)
        }
      }
      for (const utterance of utterances) {
        try {
          const filename = writeUtterances(compiler, utterance.name, utterance.utterances, outputDir)
          console.log(`SUCCESS: wrote utterances to file ${filename}`)
        } catch (err) {
          console.log(`WARNING: writing utterances "${utterance.name}" failed: ${err.message}`)
        }
      }
    }
  }
}
