'use strict'

const mockr = require('mock-require')

/**
 * ipcEmitter is a mock for ipc-emitter module. This is required since the
 * WebSocket module is meant to run in a forked environment and since the test
 * cases are executed in a non-forked environment, IPC-Emitter warns the user.
 * @type {Object}
 */
const ipcEmitter = { worker: { emit: () => {} } }

mockr('ipc-emitter', ipcEmitter)

describe('WebSocket Server:', function () {
  after(function () {
    mockr.stop('ipc-emitter')
  })

  ;['utils/broadcast',
    'utils/serialize',
    'listeners/messages',
    'listeners/rooms',
    'verify-client'
  ].forEach(function (cases) {
    require(`./${cases}-test`)
  })
})
