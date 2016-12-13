'use strict'

const {worker} = require('ipc-emitter')
const notifyStore = require('../store')
const setup = require('./setup')

module.exports = {
  /**
   * users stores a reference of the WebSocket connection of logged in users
   * indexed by the user ID.
   * @type {Object}
   */
  users: {},

  /**
   * rooms stores a reference of the WebSocket connection of logged in users
   * indexed by room IDs.
   * @type {Object}
   */
  rooms: {},

  /**
   * states stores the different states a user can be in. These are loaded
   * during the initiation of the WebSocket Manager.
   * @type {Object}
   */
  states: {},

  /**
   * initializes the WebSocket Manager.
   * @return {Promise} Resolved once the WebSocket Manager has been initialized.
   */
  init () {
    worker.emit('logs:info', 'ws', `setting up manager`)
    return setup.getStates(this)
  },

  /**
   * addUser adds a WebSocket connection to the Manager.
   * @param {Object} socket WebSocket object.
   */
  addUser (socket) {
    const {user} = socket.upgradeReq.notify

    // When the user exists the application we need to:
    //   > Change the user state to offline.
    //   > Remove the WebSocket from the manager
    socket.on('close', () => {
      notifyStore.store.update(notifyStore.types.USERS, {
        id: user.id,
        replace: {
          state: this.states.offline
        }
      })

      this.removeUser(socket)
    })

    // Change the user state to online.
    notifyStore.store.update(notifyStore.types.USERS, {
      id: user.id,
      replace: {
        state: this.states.online
      }
    })

    // Include the socket in the users list.
    this.users[user.id] = socket

    // Include WebSocket connection in the rooms the user is in.
    user.rooms.forEach(roomID => this.addUserToRoom(roomID, socket))
  },

  /**
   * Adds a user inside a room
   * @param {String} roomID The room id.
   * @param {Object} socket WebSocket object of the user.
   */
  addUserToRoom (roomID, socket) {
    const room = this.rooms[roomID]

    if (room === undefined) {
      this.rooms[roomID] = [socket]
    } else if (!~room.indexOf(socket)) {
      this.rooms[roomID].push(socket)
    }
  },

  /**
   * Removes a user.
   * @param  {Object} socket WebSocket object of the user.
   */
  removeUser (socket) {
    const {user} = socket.upgradeReq.notify
    delete this.users[user.id]
    user.rooms.forEach(roomID => this.removeUserFromRoom(roomID, socket))
  },

  /**
   * removes a user from a room.
   * @param  {String} roomID The room id.
   * @param  {Object} socket WebSocket object of the user
   */
  removeUserFromRoom (roomID, socket) {
    const room = this.rooms[roomID]
    if (room === undefined) return
    if (room.length === 1) delete this.rooms[roomID]
    const pos = room.indexOf(socket)
    room.splice(pos, 1)
  }
}
