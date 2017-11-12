const configuration = require('../src/db/knex-config')

module.exports = {
  development: configuration,
  test: configuration,
  production: configuration
}
