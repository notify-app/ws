'use strict'

const utils = require('notify-utils')
const config = require('../../../config')
const notifyStore = require('../../store')
const logger = require('../../logger')

/**
 * broadcast is a utility used to send a WebSocket payload to a user. The origin
 * of a payload can either be through code or submitted by a user connected to
 * the WebSocket server. The payload is only sent to specified user if:
 *   1. The payload has not originated from the user.
 *   2. The token of the reciever the payload is still valid.
 * @param  {Object} user            The socket object of the reciever.
 * @param  {String} payload         The payload to be sent.
 * @param  {Object} options.request FortuneJS context request related to the
 *                                  change.
 * @return {Promise}                Resolved when the payload has been either
 *                                  sent or not.
 */
module.exports = (user, payload, {request}) => {
  // If request doesn't have info which we can use to retrieve the author of the
  // change (i.e. using access token) send the payload. When this happens the
  // payload would have originated from code and therefore the reciever.
  if (request.meta === undefined || request.meta.headers === undefined) {
    return sendPayload(user, payload)
  }

  // If there is, we should send the payload only if:
  //    1. The user recieving the payload is not the author if the change.
  //    2. The token of the user recieving the payload is still valid.
  return utils.getTokenFromRequest(request.meta.headers, config.session)
    .then(tokenValue => {
      const userToken = user.upgradeReq.notify.token

      // If the user recieiving the payload is the author of the change, do
      // nothing.
      if (tokenValue === userToken.token) return

      // Else before sending the payload make sure that he has a valid token.
      // If he doesn't close his socket connection and remove the token from db.
      return sendPayload(user, payload)
    })
    .catch(() => {
      logger.warn('Unthrusted socket broadcast', request.meta)
    })
}

/**
 * sendPayload is used to validate the reciever token, and if valid it sends him
 * the payload
 * @param  {Object} user            The socket object of the reciever.
 * @param  {String} payload         The payload to be sent.
 * @return {Promise}                Resolved promise once either the payload has
 *                                  been sent, or the reciever has been
 *                                  disconnected.
 */
function sendPayload (user, payload) {
  const userToken = user.upgradeReq.notify.token

  // Validate reciever token.
  return utils.validateToken(userToken, { maxAge: config.session.maxAge })
    // If valid send payload.
    .then(() => user.send(payload))
    // If not valid delete token from db and disconnect reciever.
    .catch(token => {
      return notifyStore.store.delete(notifyStore.types.TOKENS, token.id)
        .then(() => user.close())
    })
}
