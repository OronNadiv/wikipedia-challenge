module.exports = {
  postgres: process.env.DATABASE_URL || 'postgres://postgres:@localhost/wiki_temp',
  amqp: {
    url: process.env.AMQP_URL || 'amqp://guest:guest@localhost:5672'
  }
}
