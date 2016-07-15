module.exports = {
  up: (knex, Promise) =>
    Promise
      .try(() =>
        knex.schema.createTable('uris', (table) => {
          table.increments('id').primary()
          table.text('uri').notNullable().unique()
          table.integer('last_status')
          table.timestamps()
        })
      )
      .then(() =>
        knex.schema.createTable('links', (table) => {
          table.increments('id').primary()
          table.integer('from_id')
            .notNullable()
            .references('id')
            .inTable('uris')
            .onDelete('CASCADE')
            .onUpdate('CASCADE')
          table.integer('to_id')
            .notNullable()
            .references('id')
            .inTable('uris')
            .onDelete('CASCADE')
            .onUpdate('CASCADE')
          table.index(['from_id'])
          table.index(['to_id'])
          table.index(['from_id', 'to_id'])
        })
      ),

  down: (knex, Promise) =>
    Promise
      .resolve(knex.schema.dropTable('links'))
      .then(() => knex.schema.dropTable('uris'))
}
