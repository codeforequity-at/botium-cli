const util = require('util')
const path = require('path')
const fs = require('fs')
const slug = require('slug')
const { BotDriver } = require('botium-core')
const debug = require('debug')('botium-cli-nlp')

const { getConnector } = require('./index')

const extract = async (argv) => {
  const driver = new BotDriver()
  const pluginConnector = getConnector(driver.caps.CONTAINERMODE)

  if (!pluginConnector || !pluginConnector.NLP) {
    console.log(`NLP Analytics not supported by connector ${driver.caps.CONTAINERMODE}`)
  }
  const { ExtractIntentUtterances } = pluginConnector.NLP

  let extractedIntents = null
  try {
    extractedIntents = await ExtractIntentUtterances({})
    debug(`Extracted intent utterances: ${JSON.stringify(extractedIntents.intents.map(i => ({ intentName: i.intentName, utterances: i.utterances.length })), null, 2)}`)
  } catch (err) {
    console.log(`Failed to extract utterances: ${err.message}`)
    return
  }

  for (const e of extractedIntents.intents) {
    const filename = path.resolve(argv.convos[0], `${slug(e.intentName)}.utterances.txt`)
    try {
      fs.writeFileSync(filename, [
        e.intentName,
        ...e.utterances
      ].join('\r\n'))
      console.log(`Extracted intent utterances for ${e.intentName} to ${filename}`)
    } catch (err) {
      console.log(`Failed to extract intent utterances for ${e.intentName} to ${filename}: ${err.message}`)
    }
  }
}

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)
  extract(argv)
}

module.exports = {
  command: 'nlpextract',
  describe: 'Extract utterances from connector workspace for NLP Analytics',
  builder: (yargs) => {
  },
  handler
}
