'use strict'

const utils = require('notify-utils')
const config = require('../config')
const notifyStore = require('./store')

/**
 * verifyClient makes sure that the user trying to connect with the WebSocket
 * server is authenticated. This method will be invoked by WebSocket Server on
 * every new connection.
 * @param  {Object}   info Info about the request.
 * @param  {Function} cb   A callback that must be called by the user upon
 *                         inspection of the info fields
 * @return {Promise}       Resolved once the request has been inspected.
 */
module.exports = (info, cb) => {
  return getToken(info.req.headers.cookie)
    .then(getUser.bind(null, info.origin))
    .then(([token, user]) => {
      info.req.notify = { token, user }
      cb(true)
    })
    .catch(() => cb(false, 401, 'Unauthorized'))
}

/**
 * getToken is used to retrieve the token object from the database using the
 * access token from the cookie header.
 * @param  {String} cookieString The cookie string from the upgrade request.
 * @return {Promise} Resolved promise with the token object if access token
 *                   exists in db. Rejected otherwise.
 */
function getToken (cookieString) {
  return utils.getCookieValue(cookieString, config.session.cookie)
    .then(tokenValue => {
      return notifyStore.store.find(notifyStore.types.TOKENS, undefined, {
        match: {
          token: tokenValue
        }
      })
    })
    .then(({payload}) => {
      if (payload.count === 0) return Promise.reject()
      return payload.records[0]
    })
}

/**
 * getUser is used to retrieve the owner (user) of the access token provided in
 * the params.
 * @param  {Object} token  Token object.
 * @param  {String} origin Origin value of the request.
 * @return {Promise}       Resolved promise with the token & owner object if
 *                         owner is found and access token is still valid.
 *                         Rejected otherwise.
 */
function getUser (origin, token) {
  const opts = {
    origin,
    maxAge: config.session.maxAge
  }

  return Promise.all([
    token,
    utils.getUserByToken(token, notifyStore, opts)
  ])
}
