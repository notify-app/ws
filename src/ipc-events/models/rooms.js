'use strict'

const serialize = require('../libs/serialize')
const types = require('../libs/types')

const attributes = ['name', 'image']
const relationships = [
  { key: 'users', type: types.USERS },
  { key: 'messages', type: types.MESSAGES }
]

module.exports = (manager) => {
  /**
   * Listener to be invoked when a room resource is created or updated. The
   * members of the room created/modified should be notified.
   * @param  {Object} record Record created/updated.
   */
  return (record, context) => {
    syncManager(record)
    const users = getAffectedUsers(record)
    if (users.length === 0) return
    const payload = serialize(record, types.ROOMS, attributes, relationships)
    users.forEach(user => broadcast(user, payload, context))
  }

  /**
   * syncManager syncs the changes done to the room with the info stored in the
   * manager.
   * @param  {Object} record Created/updated room.
   */
  function syncManager (record) {
    record.users.forEach(userID => {
      const user = manager.users[userID]
      if (user === undefined) return
      manager.addUserToRoom(record.id, user)
    })
  }

  /**
   * Returns the Socket object of the users who should be notified of the
   * change. When a room is created/updated users who are within the room should
   * be notified
   * @param  {Object} record Created/updated room.
   * @return {Array}         List of Socket which will be notified of the
   *                         change.
   */
  function getAffectedUsers (record) {
    const users = []
    record.users.forEach(userID => {
      const user = manager.users[userID]
      if (user !== undefined) users.push(user)
    })
    return users
  }
}
