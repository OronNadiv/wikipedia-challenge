const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('./logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)
const info = log.info.bind(log, LOG_PREFIX)

const config = require('./config')
const amqp = require('amqplib-easy')(config.amqp.url)
const _ = require('underscore')
const bookshelf = require('./db/bookshelf')
const fs = require('fs-promise')
const linkscrape = require('linkscrape')
const Promise = require('bluebird')
const toExclude = require('./to-exclude')
const Uri = require('./db/models/uri')
const uriCache = new Map()
const url = require('url')

const lsPromsied = (uri, data) => {
  return new Promise((resolve) => {
    linkscrape(uri, data, resolve)
  })
}

class DocProcessor {
  constructor (uriId, uri, filepath) {
    if (!uriId) {
      throw Error('expecting uriId')
    }
    if (!uri) {
      throw Error('expecting uri')
    }
    if (!filepath) {
      throw Error('expecting filepath')
    }
    this.fromUriId = uriId
    this.fromUri = uri
    this.filepath = filepath
  }

  static deleteDuplcateLinks () {
    return bookshelf.knex.raw(
      `
DELETE FROM links
WHERE id IN (SELECT id
              FROM (SELECT id,
                             ROW_NUMBER() OVER (partition BY from_id, to_id ORDER BY id) AS rnum
                     FROM links) t
              WHERE t.rnum > 1);
`
    )
  }

  static loadCaches () {
    return Uri.forge().fetchAll({columns: ['uri', 'id']})
      .then((uris) => {
        _.each(uris.models, (model) => {
          uriCache.set(model.get('uri'), model.id)
        })
        info('uris have been loaded into memory. count:', uris.length)
      })
  }

  _getUri ({href}) {
    const self = this

    if (!href ||
      _.find(toExclude.indexOf, (item) => href.indexOf(item) > 0) ||
      _.find(toExclude.startsWith, (item) => href.startsWith(item))
    ) {
      return
    }

    if (href.indexOf('#') > 0) {
      href = href.substring(0, href.indexOf('#'))
    }
    const parsedFromUri = url.parse(self.fromUri)
    const parsedToUri = url.parse(`${parsedFromUri.protocol}//${parsedFromUri.hostname}${href}`)

    return `${parsedToUri.protocol}//${parsedToUri.hostname}${parsedToUri.pathname}`
  }

  _processLinks (links) {
    const self = this

    const toUris = links.map((link) => self._getUri(link))

    const toUrisUnique = _.chain(toUris).filter((val) => !!val).uniq().value()
    return bookshelf.transaction((t) => {
      return Promise
        .map(toUrisUnique, (toUri) => {
          return Promise
            .try(() => {
              const id = uriCache.get(toUri)
              if (id) {
                return {id}
              }
              return Uri.forge()
                .query({where: {uri: toUri}})
                .fetch({transacting: t})
                .then((toUriModel) => {
                  if (toUriModel) {
                    uriCache.set(toUri, toUriModel.id)
                    return toUriModel
                  }
                  toUriModel = new Uri({uri: toUri})
                  return toUriModel.save(null, {transacting: t})
                    .tap((toUriModel) => {
                      uriCache.set(toUri, toUriModel.id)
                      return amqp.sendToQueue({queue: 'wiki-challenge.download.pending'}, toUriModel.toJSON())
                    })
                })
            })
            .then((toUriModel) => {
              return `(${self.fromUriId}, ${toUriModel.id})`
            })
        })
        .then((links) => {
          if (!links.length) {
            return
          }
          const sql = `INSERT INTO links (from_id, to_id) VALUES ${links.join()};`
          verbose('sql:', sql)
          return t.raw(sql)
        })
    })
  }

  execute () {
    const self = this
    info('Processing:', self.fromUri)
    return Promise
      .resolve(fs.readFile(self.filepath))
      .then((data) => lsPromsied(self.fromUri, data))
      .then((links) => self._processLinks(links))
      .then(() => fs.unlink(self.filepath))
  }
}

module.exports = DocProcessor
