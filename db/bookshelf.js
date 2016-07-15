const bookshelf = require('bookshelf')
const knex = require('knex')
const knexConfig = require('./knex-config')

const ORM = bookshelf(knex(knexConfig))

ORM.plugin('pagination')

module.exports = ORM
