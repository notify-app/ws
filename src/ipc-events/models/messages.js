'use strict'

const serialize = require('../libs/serialize')
const broadcast = require('../libs/broadcast')
const types = require('../libs/types')

const attributes = ['content', 'deleted']
const relationships = [
  { key: 'user', type: types.USERS },
  { key: 'room', type: types.ROOMS }
]

module.exports = (manager) => {
  /**
   * Listener to be invoked when a message resource is created or updated. The
   * members of the room in which the message was created/modified should be
   * notified.
   * @param  {Object} record Record created/updated.
   */
  return (record, context) => {
    const users = getAffectedUsers(record)
    if (users.length === 0) return
    const payload = serialize(record, types.MESSAGES, attributes, relationships)
    users.forEach(user => broadcast(user, payload, context))
  }

  /**
   * Returns the Socket object of the users who should be notified of the
   * change. When a message is created/updated all users who are in the same
   * room in which the message was created, should be notified.
   * @param  {Object} record Created/updated message.
   * @return {Array}         List of Socket which will be notified of the
   *                         change.
   */
  function getAffectedUsers (record) {
    const room = manager.rooms[record.room]
    return (room !== undefined) ? room : []
  }
}
