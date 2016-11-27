'use strict'

const {worker} = require('ipc-emitter')
const createUsersListeners = require('./models/users')
const createRoomsListeners = require('./models/rooms')
const createMessagesListeners = require('./models/messages')

module.exports = (manager) => {
  const usersListeners = createUsersListeners(manager)
  const roomsListeners = createRoomsListeners(manager)
  const messageListeners = createMessagesListeners(manager)

  ;['create', 'update'].forEach(crud => {
    worker.on(`api:users:${crud}`, usersListeners)
    worker.on(`api:rooms:${crud}`, roomsListeners)
    worker.on(`api:messages:${crud}`, messageListeners)
  })
}
