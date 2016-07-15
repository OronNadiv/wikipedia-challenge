const path = require('path')
const config = require('../config')

module.exports = {
  // debug: true,

  client: 'pg',
  connection: config.postgres,

  pool: {
    min: 1,
    max: 10
  },

  migrations: {
    directory: path.join(__dirname, 'migrations')
  }
}
