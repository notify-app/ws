'use strict'

const assert = require('assert')
const sinon = require('sinon')
const utils = require('notify-utils')
const config = require('../config')
const verifyClient = require('../src/verify-client')
const notifyStore = require('../src/store')

describe('Verify Client functionality', function () {
  describe('Scenario: Connecting without a token:', function () {
    describe('When trying to connect without a token,', function () {
      let cb = null

      beforeEach(function () {
        const info = {
          req: {
            headers: {
              cookie: `${config.session.cookie}-invalid=abc123`
            }
          }
        }

        cb = sinon.stub()

        return verifyClient(info, cb)
      })

      it('should stop the connection', function () {
        assert.strictEqual(cb.calledOnce, true)
        assert.deepStrictEqual(cb.getCall(0).args, [
          false,
          401,
          'Unauthorized'
        ])
      })
    })
  })

  describe('Scenario: Connecting with an unknown token:', function () {
    describe('When trying to connect with a token which is not in db,', function () {
      let cb = null
      let tokenValue = null

      beforeEach(function () {
        tokenValue = 'abc123'

        const info = {
          req: {
            headers: {
              cookie: `${config.session.cookie}=${tokenValue}`
            }
          }
        }

        sinon.stub(notifyStore.store, 'find').returns({
          payload: {
            count: 0,
            records: []
          }
        })

        cb = sinon.stub()

        return verifyClient(info, cb)
      })

      afterEach(function () {
        notifyStore.store.find.restore()
      })

      it('should query the db for the token', function () {
        assert.strictEqual(notifyStore.store.find.calledOnce, true)
        assert.strictEqual(notifyStore.store.find.getCall(0).args[0],
          notifyStore.types.TOKENS)
        assert.strictEqual(notifyStore.store.find.getCall(0).args[1],
          undefined)
        assert.strictEqual(notifyStore.store.find.getCall(0).args[2]
          .match.token, tokenValue)
      })

      it('should stop the connection', function () {
        assert.strictEqual(cb.calledOnce, true)
        assert.deepStrictEqual(cb.getCall(0).args, [
          false,
          401,
          'Unauthorized'
        ])
      })
    })
  })

  describe('Scenario: Connecting with an invalid token:', function () {
    describe('When trying to connect with an invalid token (expired or cross-origin),', function () {
      let cb = null
      let token = null
      let origin = null
      let tokenValue = null

      beforeEach(function () {
        token = {}

        tokenValue = 'abc123'

        origin = 'http://example.com'

        const info = {
          origin,
          req: {
            headers: {
              cookie: `${config.session.cookie}=${tokenValue}`
            }
          }
        }

        sinon.stub(utils, 'getUserByToken').returns(Promise.reject())

        sinon.stub(notifyStore.store, 'find').returns({
          payload: {
            count: 1,
            records: [token]
          }
        })

        cb = sinon.stub()

        return verifyClient(info, cb)
      })

      afterEach(function () {
        utils.getUserByToken.restore()
        notifyStore.store.find.restore()
      })

      it('should request the owner of the access token', function () {
        assert.strictEqual(utils.getUserByToken.calledOnce, true)
        assert.strictEqual(utils.getUserByToken.getCall(0).args[0], token)
        assert.deepStrictEqual(utils.getUserByToken.getCall(0).args[1], {
          origin,
          notifyStore,
          maxAge: config.session.maxAge
        })
      })

      it('should stop the connection', function () {
        assert.strictEqual(cb.calledOnce, true)
        assert.deepStrictEqual(cb.getCall(0).args, [
          false,
          401,
          'Unauthorized'
        ])
      })
    })
  })

  describe('Scenario: Connecting with a valid token:', function () {
    describe('When trying to connect with an valid token,', function () {
      let cb = null
      let info = null
      let user = null
      let token = null
      let origin = null
      let tokenValue = null

      beforeEach(function () {
        user = {}
        token = {}
        origin = 'http://example.com'
        tokenValue = 'abc123'

        info = {
          origin,
          req: {
            headers: {
              cookie: `${config.session.cookie}=${tokenValue}`
            }
          }
        }

        sinon.stub(utils, 'getUserByToken').returns(Promise.resolve({
          count: 1,
          payload: {
            records: [user]
          }
        }))

        sinon.stub(notifyStore.store, 'find').returns({
          payload: {
            count: 1,
            records: [token]
          }
        })

        cb = sinon.stub()

        return verifyClient(info, cb)
      })

      afterEach(function () {
        utils.getUserByToken.restore()
        notifyStore.store.find.restore()
      })

      it('should request the owner of the access token', function () {
        assert.strictEqual(utils.getUserByToken.calledOnce, true)
        assert.strictEqual(utils.getUserByToken.getCall(0).args[0], token)
        assert.deepStrictEqual(utils.getUserByToken.getCall(0).args[1], {
          origin,
          notifyStore,
          maxAge: config.session.maxAge
        })
      })

      it('should accept the connection', function () {
        assert.strictEqual(cb.calledOnce, true)
        assert.deepStrictEqual(cb.getCall(0).args, [true])
      })

      it('should store the token object in the socket', function () {
        assert.strictEqual(info.req.notify.token, token)
      })

      it('should store the user object in the socket', function () {
        assert.strictEqual(info.req.notify.user, user)
      })
    })
  })
})
