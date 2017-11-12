const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('./logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)
const info = log.info.bind(log, LOG_PREFIX)
const error = log.info.bind(log, LOG_PREFIX)

const config = require('./config')
const amqp = require('amqplib-easy')(config.amqp.url)
const _ = require('underscore')
const bookshelf = require('./db/bookshelf')
const fs = require('fs-promise')
const http = require('http-as-promised')
const toExclude = require('./to-exclude')
const Uri = require('./db/models/uri')
const uuid = require('node-uuid')
const url = require('url')

class DocDownloader {
  constructor (uriModel) {
    if (!uriModel) {
      throw Error('expecting uriModel')
    }
    if (!uriModel.id) {
      throw Error('expecting uriModel.id')
    }
    if (!uriModel.get('uri')) {
      throw Error('expecting uriModel.uri')
    }
    this.uriModel = uriModel
  }

  execute () {
    const self = this

    const uri = this.uriModel.get('uri')

    if (
      _.find(toExclude.indexOf, (item) => uri.indexOf(item) > 0)
    ) {
      verbose('skipped. uri:', uri)
      return
    }

    const parsed = url.parse(uri)

    if (parsed.hostname !== 'he.wikipedia.org') {
      error('not wikipedia. uri:', uri)
      return
    }
    info('Downloading:', uri)
    return http(uri, {error: false})
      .spread((response, body) =>
        bookshelf.transaction((t) => {
          const status = response.statusCode
          if (!status) {
            throw Error(`status cannot be found.  response: ${response}`)
          }
          return Promise
            .resolve(self.uriModel.save({last_status: status}, {transacting: t, patch: true}))
            .then((savedUriModel) => {
              switch (status) {
                case 301:
                case 302:
                  const location = response.headers.location
                  if (!location) {
                    throw Error(`location cannot be found. status: ${status}, location: ${location}`)
                  }

                  return Uri.forge().query({where: {uri: location}}).fetch()
                    .then((uriModel) => {
                      if (uriModel) {
                        return
                      }
                      const newUriModel = new Uri({uri: location})
                      return amqp.sendToQueue({queue: 'wiki-challenge.download.pending'}, newUriModel.toJSON())
                    })
                case 200:
                  const filepath = path.join(__dirname, '../temp', uuid.v4())
                  verbose('filepath:', filepath)
                  return Promise
                    .resolve(fs.writeFile(filepath, body))
                    .then(() => amqp.sendToQueue({queue: 'wiki-challenge.process.pending'}, {
                      fromUriId: savedUriModel.id,
                      fromUri: self.uriModel.get('uri'),
                      filepath
                    }))
                case 404:
                case 400:
                  return
                default:
                  throw Error(`unknown status. status: ${status}, uri: ${self.uriModel.get('uri')}`)
              }
            })
        })
      )
  }
}

module.exports = DocDownloader
