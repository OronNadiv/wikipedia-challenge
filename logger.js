const moment = require('moment')
const winston = require('winston')

module.exports = new winston.Logger({
  transports: [
    new (winston.transports.Console)({
      colorize: true,
      json: false,
      timestamp: () => moment().format()
    })
  ],
  exceptionHandlers: [
    new (winston.transports.Console)({
      colorize: true,
      json: false,

      timestamp: () => {
        /* istanbul ignore next */
        return moment().format()
      },

      humanReadableUnhandledException: true
    })
  ],
  /* istanbul ignore next */
  level: process.env.LOG_LEVEL ||
  /* istanbul ignore next */
  'info',
  exitOnError: false
})
