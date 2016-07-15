const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('../logger')
const error = log.error.bind(log, LOG_PREFIX)

const _ = require('underscore')
const config = require('../config')
const amqpEasy = require('amqplib-easy')(config.amqp.url)

module.exports = _.reduce(
  amqpEasy,
  (acc, method, methodName) => {
    acc[methodName] = function () {
      return method.apply(amqpEasy, arguments)
        .catch((err) => {
          /* istanbul ignore next */
          error('Error:', err)
        })
    }
    return acc
  },
  {}
)
