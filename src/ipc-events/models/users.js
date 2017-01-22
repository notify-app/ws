'use strict'

const utils = require('../utils')
const attributes = ['username', 'image', 'bot']
const relationships = [
  { key: 'rooms', type: utils.types.ROOMS },
  { key: 'state', type: utils.types.STATES },
  { key: 'messages', type: utils.types.MESSAGES }
]

module.exports = (manager) => {
  /**
   * Listener to be invoked when a user resource is created or updated. All
   * logged in users should be notified.
   * @param  {Object} record Record created/updated.
   */
  return (record, context) => {
    syncManager(record)
    const userIDs = Object.keys(manager.users)
    if (userIDs.length === 0) return
    const payload = utils.serialize(record, utils.types.USERS, attributes,
      relationships)
    userIDs.forEach(userID => {
      const user = manager.users[userID]
      utils.broadcast(user, payload, context)
    })
  }

  /**
   * syncManager syncs the changes done to the room with the info stored in the
   * manager.
   * @param  {Object} record Created/updated room.
   */
  function syncManager (record) {
    const user = manager.users[record.id]
    if (user === undefined) return
    record.rooms.forEach(roomID => manager.addUserToRoom(roomID, user))
  }
}
