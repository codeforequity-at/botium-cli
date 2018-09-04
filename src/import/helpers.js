const slug = require('slug')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

module.exports.writeConvosExcel = (compiler, convos, outputDir, filenamePrefix) => {
  const filename = path.resolve(outputDir, slug(filenamePrefix) + '.xlsx')

  mkdirp.sync(outputDir)

  const scriptData = compiler.Decompile(convos, 'SCRIPTING_FORMAT_XSLX')

  fs.writeFileSync(filename, scriptData)
  return filename
}

module.exports.writeIntentsExcel = (buffer, outputDir, filenamePrefix) => {
  const filename = path.resolve(outputDir, slug(filenamePrefix) + '.xlsx')

  mkdirp.sync(outputDir)

  fs.writeFileSync(filename, buffer)
  return filename
}

module.exports.writeConvo = (compiler, convo, outputDir) => {
  const filename = path.resolve(outputDir, slug(convo.header.name) + '.convo.txt')

  mkdirp.sync(outputDir)

  const scriptData = compiler.Decompile([ convo ], 'SCRIPTING_FORMAT_TXT')

  fs.writeFileSync(filename, scriptData)
  return filename
}

module.exports.writeUtterances = (compiler, utterance, samples, outputDir) => {
  const filename = path.resolve(outputDir, slug(utterance) + '.utterances.txt')

  mkdirp.sync(outputDir)

  const scriptData = [ utterance, ...samples ].join('\n')

  fs.writeFileSync(filename, scriptData)
  return filename
}
