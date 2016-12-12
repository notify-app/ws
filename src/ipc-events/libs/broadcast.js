'use strict'

const utils = require('notify-utils')
const config = require('../../../config')
const notifyStore = require('../../store')

/**
 * broadcast payload to a user after making sure that he is not the author of
 * the change.
 * @param  {Object} socket          The socket object related to the user
 *                                  which will be recieving the update.
 * @param  {String} payload         The payload to be sent.
 * @param  {Object} options.request FortuneJS context request related to the
 *                                  change.
 * @return {Promise}                Resolved when the payload has been either
 *                                  sent or not.
 */
module.exports = (user, payload, {request}) => {
  // If request doesn't have info which we can use to retrieve the author of the
  // change (i.e. using access token) send the payload. When this happens the
  // change would have been done via code not through the api.
  if (request.meta === undefined || request.meta.headers === undefined) {
    return user.send(payload)
  }

  // If there is, we should send the payload only if:
  //    1. The user recieving the payload is not the author if the change.
  //    2. The token of the user recieving the payload is still valid.
  const userToken = user.upgradeReq.notify.token
  return utils.getCookieValue(request.meta.headers.cookie, config.session.name)
    .then(tokenValue => {
      // If the user recieiving the payload is the author of the change, do
      // nothing.
      if (tokenValue === userToken.token) return

      // Else before sending the payload make sure that he has a valid token.
      // If he doesn't close his socket connection and remove the token from db.
      return utils.validateToken(userToken, { maxAge: config.session.maxAge })
        .then(() => user.send(payload))
        .catch(token => {
          return notifyStore.store.delete(notifyStore.types.TOKENS, token.id)
            .then(() => user.close())
        })
    })
}