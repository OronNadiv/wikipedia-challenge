module.exports = {
  postgres: process.env.DATABASE_URL || 'postgres://postgres:@localhost/wiki_temp',
  postgresPool: {
    min: parseInt(process.env.POSTGRESPOOLMIN || 2, 10),
    max: parseInt(process.env.POSTGRESPOOLMAX || 10, 10),
    log: process.env.POSTGRESPOOLLOG === 'true',
    afterCreate: (connection, cb) => connection.query(`SET SESSION SCHEMA 'public';`, cb)
  },
  amqp: {
    url: process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672'
  }
}
