'use strict'

/**
 * The types of the JSONAPI resources mean to be used in the payload sent using
 * WebSockets.
 * @type {Object}
 */
module.exports = {
  /**
   * User type.
   * @type {String}
   */
  USERS: 'user',

  /**
   * Room type.
   * @type {String}
   */
  ROOMS: 'room',

  /**
   * Message type.
   * @type {String}
   */
  MESSAGES: 'message',

  /**
   * State type.
   * @type {String}
   */
  STATES: 'state'
}