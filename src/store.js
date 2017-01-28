'use strict'

const store = require('notify-store')
const {worker} = require('ipc-emitter')
const config = require('../config')

const notifyStore = Object.create(store)

// Create notify store instance and provide the worker IPC-Emitter of the forked
// process. This will make it possible to recieve IPC-Events emitted by other
// processes inside the Notify IPC-Emitter network.
notifyStore.init({
  worker,
  url: config.db.url
})

module.exports = notifyStore
