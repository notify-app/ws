'use strict'

const store = require('notify-store')
const {worker} = require('ipc-emitter')
const config = require('../config')

const notifyStore = Object.create(store)

notifyStore.init({
  worker,
  url: config.db.url
})

module.exports = notifyStore
