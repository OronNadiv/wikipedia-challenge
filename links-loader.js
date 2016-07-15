const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('./logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)

const Link = require('./db/models/link')

class LinksLoader {
  fetch (nodes) {
    verbose('next called.  loading more connections. requested count:', nodes.length)

    return Link
      .forge()
      .query((qb) => qb.whereIn('from_id', nodes))
      .fetchAll()
      .then((links) => {
        verbose('loaded count:', links.length)
        const res = new Map()
        links.models.forEach((link) => {
          const toId = link.get('to_id')
          const fromId = link.get('from_id')
          const toIds = res.get(fromId) || []
          if (!toIds.length) {
            res.set(fromId, toIds)
          }
          toIds.push(toId)
        })
        return res
      })
  }
}

module.exports = LinksLoader
