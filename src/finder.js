const path = require('path')
const LOG_PREFIX = `"${path.basename(__filename)}":`
const log = require('./logger')
const verbose = log.verbose.bind(log, LOG_PREFIX)
const info = log.info.bind(log, LOG_PREFIX)

const BFS = require('bfs-as-promised')
const LinksLoader = require('./links-loader')
const moment = require('moment')
const Promise = require('bluebird')
const Uri = require('./db/models/uri')

class Finder {
  constructor (fromUri, toUri) {
    this.fromUri = fromUri
    this.toUri = toUri
  }

  execute () {
    const self = this
    return Promise
      .all([
        Uri.forge().query({where: {uri: this.fromUri}}).fetch({require: true}),
        Uri.forge().query({where: {uri: this.toUri}}).fetch({require: true})
      ])
      .spread((fromUri, toUri) => {
        verbose('Searching...',
          'fromId:', fromUri.id,
          'toId:', toUri.id)
        const isGoal = (id) => {
          self.isGoalCalls += 1
          // verbose('isGoal called.  id:', id, 'isGoalCalls:', self.isGoalCalls)
          return id === toUri.id
        }

        const linksLoader = new LinksLoader(fromUri.id)
        const getMoves = (fromNodes, depth) => {
          verbose('next not found.  loading. depth:', depth)
          return linksLoader.fetch(fromNodes)
        }

        const bfs = new BFS(fromUri.id, getMoves, isGoal)
        return bfs.find()
      })
      .then((path) => {
        if (!path || !path.length) {
          return path
        }
        return Uri
          .forge()
          .query((qb) => qb.whereIn('id', path))
          .fetchAll()
          .then((uris) =>
            path.map((uriId) =>
              uris.find((uri) => uri.id === uriId).get('uri')
            )
          )
      })
  }
}

const fromUri = process.argv[2]
const toUri = process.argv[3]

info('from uri:', fromUri)
info('to uri:', toUri)

const finder = new Finder(fromUri, toUri)
const startedAt = moment()
info('started at:', startedAt.format('LLLL'))
finder.execute().then((path) => {
  const finishedAt = moment()
  info('finished at:', finishedAt.format('LLLL'))
  info('Total time:', moment.duration(finishedAt.diff(startedAt)).humanize())
  if (path && path.length) {
    info(`Path:
${path.join('\n')}`)
  } else {
    info('Path could not be found.')
  }
  process.exit()
})
