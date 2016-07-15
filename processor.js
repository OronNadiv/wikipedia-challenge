const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('./logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)
const info = log.info.bind(log, LOG_PREFIX)

const Promise = require('bluebird')
const config = require('./config')
const amqp = require('amqplib-easy')(config.amqp.url)
const Processor = require('./doc-processor')

Promise
  .try(Processor.loadCaches)
  .then(() => amqp.consume({queue: 'wiki-challenge.process.pending'},
    ({json}) => {
      verbose('processing queue item.', json)
      const processor = new Processor(
        json.fromUriId,
        json.fromUri,
        json.filepath
      )
      return processor.execute()
    }
    )
  )
  .then(() => info('Processor is running.'))
