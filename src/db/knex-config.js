const path = require('path')
const config = require('../config')

module.exports = {
  // debug: true,
  client: 'pg',
  connection: config.postgres,
  pool: config.postgresPool,
  migrations: {
    directory: path.join(__dirname, '/migrations')
  }
}
