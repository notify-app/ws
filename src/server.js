'use strict'

const {Server} = require('ws')
const {worker} = require('ipc-emitter')
const utils = require('notify-utils')

const config = require('../config')
const manager = require('./manager')
const notifyStore = require('./store')
const createIPCListeners = require('./ipc-events')

manager.init()
  .then(() => {
    const server = new Server({
      verifyClient,
      port: config.port
    })

    // When a user successfully connects, add him to the WebSocket manager.
    server.on('connection', manager.addUser.bind(manager))

    // Create IPC Listeners.
    createIPCListeners(manager)

    worker.emit('logs:info', 'ws', `listening on port ${config.port}`)
  })
  .catch(err => worker.emit('logs:error', 'ws', err))

/**
 * verifyClient makes sure that the user trying to connect with the WebSocket
 * server is authenticated.
 * @param  {Object}   info Info about the request.
 * @param  {Function} cb   A callback that must be called by the user upon
 *                         inspection of the info fields
 * @return {Promise}       Resolved once the request has been inspected.
 */
function verifyClient (info, cb) {
  return utils.getCookieValue(info.req.headers.cookie, config.session.name)
    .then((tokenValue) => {
      return notifyStore.store.find(notifyStore.types.TOKENS, undefined, {
        match: {
          token: tokenValue
        }
      })
    })
    .then(({payload}) => {
      if (payload.count === 0) return Promise.reject()
      return payload.records[0]
    })
    .then(token => {
      const opts = {
        notifyStore,
        origin: info.origin,
        maxAge: config.session.maxAge
      }

      return Promise.all([
        token,
        utils.getUserByToken(token, opts)
      ])
    })
    .then(([token, {payload}]) => {
      info.req.notify = {
        token,
        user: payload.records[0]
      }
      cb(true)
    })
    .catch(() => cb(false, 401, 'Unathorized'))
}