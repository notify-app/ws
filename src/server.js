'use strict'

const {Server} = require('ws')
const {worker} = require('ipc-emitter')

const config = require('../config')
const manager = require('./manager')
const createIPCListeners = require('./ipc-events')
const verifyClient = require('./verify-client')

manager.init()
  .then(() => {
    // Create WebSocket server.
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
