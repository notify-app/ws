'use strict'

const setup = require('./setup')
const logger = require('../logger')
const notifyStore = require('../store')

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
    logger.info(`setting up manager`)
    return setup.getStates(this)
      .catch(logger.error)
  },

  /**
   * addUser adds a WebSocket connection to the Manager.
   * @param {Object} socket WebSocket object.
   */
  addUser (socket) {
    const {user} = socket.upgradeReq.notify

    // Change the user state to online.
    return notifyStore.store.update(notifyStore.types.USERS, {
      id: user.id,
      replace: {
        state: this.states.online
      }
    }).then(() => {
      // When the user disconnects, turn his state to offline.
      socket.on('close', () => {
        this.removeUser(socket)

        notifyStore.store.update(notifyStore.types.USERS, {
          id: user.id,
          replace: {
            state: this.states.offline
          }
        })
        .then(() => logger.info(`${user.username} signed out`))
        .catch(logger.error)
      })

       // Include the socket in the users list.
      this.users[user.id] = socket

      // Include WebSocket connection in the rooms the user is in.
      user.rooms.forEach(roomID => this.addUserToRoom(roomID, socket))

      logger.info(`${user.username} signed in`)
    }).catch(err => {
      console.log(err)
      logger.error(err)
      socket.close()
    })
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
    if (room.length === 1) return delete this.rooms[roomID]
    const pos = room.indexOf(socket)
    room.splice(pos, 1)
  },

  /**
   * Empties a room.
   * @param  {String} roomID The room id.
   */
  clearUsersFromRoom (roomID) {
    delete this.rooms[roomID]
  }
}
