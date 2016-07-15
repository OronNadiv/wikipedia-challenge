const configuration = require('../db/knex-config')

module.exports = {
  development: configuration,
  test: configuration,
  production: configuration
}
