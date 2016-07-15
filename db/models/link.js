const Bookshelf = require('../bookshelf')

module.exports = Bookshelf.Model.extend({
  tableName: 'links',
  hasTimestamps: true
})
