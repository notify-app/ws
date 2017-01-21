'use strict'

const {worker} = require('ipc-emitter')
const Logger = require('notify-logger')

// Create new logger with namespace 'ws'.
module.exports = new Logger(worker, 'ws')
