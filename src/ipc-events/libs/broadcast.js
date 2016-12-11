'use strict'

const utils = require('notify-utils')
const config = require('../../../config')

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
  // change (i.e. using access token) send the payload.
  if (request.meta === undefined || request.meta.headers === undefined) {
    user.send(payload)
  }

  // If there is info the user should only be notified if he is not the author
  // of the change.
  const userToken = user.upgradeReq.notify.token
  return utils.getCookieValue(request.meta.headers.cookie, config.session.name)
    .then(tokenValue => {
      if (tokenValue !== userToken.token) user.send(payload)
    })
}