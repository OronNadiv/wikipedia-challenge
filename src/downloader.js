const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('./logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)
const error = log.error.bind(log, LOG_PREFIX)

const config = require('./config')
const amqp = require('amqplib-easy')(config.amqp.url)
const Downloader = require('./doc-downloader')
const Uri = require('./db/models/uri')
const Promise = require('bluebird')

amqp.consume({queue: 'wiki-challenge.download.pending', exchange: 'wikipedia-challenge'},
  ({json}) => {
    verbose('processing queue item.', json)
    const downloader = new Downloader(new Uri(json))
    return Promise
      .delay(50)
      .then(() => downloader.execute())
  }
)
const fromUri = {uri: 'https://he.wikipedia.org/wiki/%D7%A2%D7%9E%D7%95%D7%93_%D7%A8%D7%90%D7%A9%D7%99'}
Promise
  .resolve(Uri.forge().query({where: fromUri}).fetch())
  .then((uri) => {
    if (uri) {
      return
    }
    return Promise
      .resolve(new Uri(fromUri).save())
      .then((uri) => {
        const downloader = new Downloader(uri)
        return downloader.execute()
      })
  })
  .catch((err) => {
    error('Failed to download the main page! Exiting.  error:', err)
    process.exit(1)
  })
