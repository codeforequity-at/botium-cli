const util = require('util')
const { buildRedisHandler, startProxy } = require('botium-core/src/grid/inbound/proxy')
const { REDIS_TOPIC } = require('botium-core/src/containers/plugins/SimpleRestContainer')
const debug = require('debug')('botium-cli-proxy')

const handler = (argv) => {
  debug(`command options: ${util.inspect(argv)}`)

  console.log(argv.redisurl)

  const redisHandler = buildRedisHandler(argv.redisurl, argv.topic)

  startProxy({
    port: argv.port,
    endpoint: '/',
    processEvent: redisHandler
  }).catch((err) => {
    debug(err)
    console.log(`Failed to start inbound proxy: ${err.message || err}`)
    process.exit(1)
  })
}

module.exports = {
  command: 'inbound-proxy',
  describe: 'Run Botium endpoint for accepting inbound messages, forwarding it to Redis',
  builder: (yargs) => {
    yargs.option('port', {
      describe: 'Local port the inbound proxy is listening to',
      number: true,
      default: 45100
    })
    yargs.option('redisurl', {
      describe: 'Redis url to forward inbound messages',
      default: 'redis://127.0.0.1:6379'
    })
    yargs.option('topic', {
      describe: 'Redis topic to forward inbound messages',
      default: REDIS_TOPIC
    })
  },
  handler
}
