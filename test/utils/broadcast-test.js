'use strict'

const assert = require('assert')
const sinon = require('sinon')
const utils = require('notify-utils')
const config = require('../../config')
const logger = require('../../src/logger')
const notifyStore = require('../../src/store')
const broadcast = require('../../src/ipc-events/utils/broadcast')

describe('Broadcast Functionality', function () {
  describe('Sending a payload originating from another user:', function () {
    describe('Given a payload,', function () {
      let payload = null

      beforeEach(function () {
        payload = {}
      })

      describe('which originated from a user,', function () {
        let request = null
        let senderTokenValue = null

        beforeEach(function () {
          senderTokenValue = 'abc123'

          request = {
            meta: {
              headers: {
                cookie: `${config.session.cookie}=${senderTokenValue}`
              }
            }
          }
        })

        describe('when trying to send it to another user:', function () {
          let user = null
          let userToken = null
          let recieverTokenValue = null

          beforeEach(function () {
            recieverTokenValue = 'def456'

            userToken = {
              id: '1',
              token: recieverTokenValue
            }

            sinon.stub(utils, 'validateToken')
              .returns(Promise.resolve(userToken))

            user = {
              send: sinon.stub(),
              upgradeReq: {
                notify: {
                  token: userToken
                }
              }
            }

            return broadcast(user, payload, {request})
          })

          afterEach(function () {
            utils.validateToken.restore()
          })

          it('should send the payload', function () {
            assert.strictEqual(user.send.calledOnce, true)
          })
        })
      })
    })
  })

  describe('Sending a payload originating from code:', function () {
    describe('Given a payload,', function () {
      let payload = null

      beforeEach(function () {
        payload = {}
      })

      describe('which originated code,', function () {
        let request = null

        beforeEach(function () {
          request = {
            meta: {}
          }
        })

        describe('when trying to send it to another user:', function () {
          let user = null
          let userToken = null
          let recieverTokenValue = null

          beforeEach(function () {
            recieverTokenValue = 'def456'

            userToken = {
              id: '1',
              token: recieverTokenValue
            }

            sinon.stub(utils, 'validateToken')
              .returns(Promise.resolve(userToken))

            user = {
              send: sinon.stub(),
              upgradeReq: {
                notify: {
                  token: userToken
                }
              }
            }

            return broadcast(user, payload, {request})
          })

          afterEach(function () {
            utils.validateToken.restore()
          })

          it('should send the payload', function () {
            assert.strictEqual(user.send.calledOnce, true)
          })
        })
      })
    })
  })

  describe('Sending a payload from a user, to a user who has an invalid token:', function () {
    describe('Given a payload,', function () {
      let payload = null

      beforeEach(function () {
        payload = {}
      })

      describe('which originated from a user,', function () {
        let request = null
        let senderTokenValue = null

        beforeEach(function () {
          senderTokenValue = 'abc123'

          request = {
            meta: {
              headers: {
                cookie: `${config.session.cookie}=${senderTokenValue}`
              }
            }
          }
        })

        describe('when trying to send it to another user who has an invalid token:', function () {
          let user = null
          let userToken = null
          let recieverTokenValue = null

          beforeEach(function () {
            recieverTokenValue = 'def456'

            userToken = {
              id: '1',
              token: recieverTokenValue
            }

            sinon.stub(utils, 'validateToken')
              .returns(Promise.reject(userToken))

            sinon.stub(notifyStore.store, 'delete')
              .returns(Promise.resolve())

            user = {
              send: sinon.stub(),
              close: sinon.stub(),
              upgradeReq: {
                notify: {
                  token: userToken
                }
              }
            }

            return broadcast(user, payload, {request})
          })

          afterEach(function () {
            utils.validateToken.restore()
            notifyStore.store.delete.restore()
          })

          it('should validate the token of the reciever', function () {
            assert.strictEqual(utils.validateToken.calledOnce, true)
            assert.strictEqual(utils.validateToken.getCall(0).args[0],
              userToken)
            assert.strictEqual(utils.validateToken.getCall(0).args[1].maxAge,
              config.session.maxAge)
          })

          it('should remove the invalid access token from db', function () {
            assert.strictEqual(notifyStore.store.delete.calledOnce, true)
            assert.deepStrictEqual(notifyStore.store.delete.getCall(0).args, [
              notifyStore.types.TOKENS,
              userToken.id
            ])
          })

          it('should not send the payload', function () {
            assert.strictEqual(user.send.calledOnce, false)
          })

          it('should close the reciever socket connection', function () {
            assert.strictEqual(user.close.calledOnce, true)
          })
        })
      })
    })
  })

  describe('Sending a payload from code, to a user who has an invalid token:', function () {
    describe('Given a payload,', function () {
      let payload = null

      beforeEach(function () {
        payload = {}
      })

      describe('which originated from code,', function () {
        let request = null

        beforeEach(function () {
          request = {
            meta: {}
          }
        })

        describe('when trying to send it to another user who has an invalid token:', function () {
          let user = null
          let userToken = null
          let recieverTokenValue = null

          beforeEach(function () {
            recieverTokenValue = 'def456'

            userToken = {
              id: '1',
              token: recieverTokenValue
            }

            sinon.stub(utils, 'validateToken')
              .returns(Promise.reject(userToken))

            sinon.stub(notifyStore.store, 'delete')
              .returns(Promise.resolve())

            user = {
              send: sinon.stub(),
              close: sinon.stub(),
              upgradeReq: {
                notify: {
                  token: userToken
                }
              }
            }

            return broadcast(user, payload, {request})
          })

          afterEach(function () {
            utils.validateToken.restore()
            notifyStore.store.delete.restore()
          })

          it('should validate the token of the reciever', function () {
            assert.strictEqual(utils.validateToken.calledOnce, true)
            assert.strictEqual(utils.validateToken.getCall(0).args[0],
              userToken)
            assert.strictEqual(utils.validateToken.getCall(0).args[1].maxAge,
              config.session.maxAge)
          })

          it('should remove the invalid access token from db', function () {
            assert.strictEqual(notifyStore.store.delete.calledOnce, true)
            assert.deepStrictEqual(notifyStore.store.delete.getCall(0).args, [
              notifyStore.types.TOKENS,
              userToken.id
            ])
          })

          it('should not send the payload', function () {
            assert.strictEqual(user.send.calledOnce, false)
          })

          it('should close the reciever socket connection', function () {
            assert.strictEqual(user.close.calledOnce, true)
          })
        })
      })
    })
  })

  describe('Sending a payload originating from the same user:', function () {
    describe('Given a payload,', function () {
      let payload = null

      beforeEach(function () {
        payload = {}
      })

      describe('which originated from a user,', function () {
        let request = null
        let senderTokenValue = null

        beforeEach(function () {
          senderTokenValue = 'abc123'

          request = {
            meta: {
              headers: {
                cookie: `${config.session.cookie}=${senderTokenValue}`
              }
            }
          }
        })

        describe('when trying to send it to the same user:', function () {
          let user = null

          beforeEach(function () {
            user = {
              send: sinon.stub(),
              upgradeReq: {
                notify: {
                  token: {
                    token: senderTokenValue
                  }
                }
              }
            }

            return broadcast(user, payload, {request})
          })

          it('should not send the payload', function () {
            assert.strictEqual(user.send.calledOnce, false)
          })
        })
      })
    })
  })

  describe('Sending a payload from an unthrusted orgin:', function () {
    describe('Given a payload,', function () {
      let payload = null

      beforeEach(function () {
        payload = {}
      })

      describe('which originated from an unthrusted origin,', function () {
        let request = null

        beforeEach(function () {
          request = {
            meta: {
              headers: {}
            }
          }
        })

        describe('when trying to send it to another user:', function () {
          let user = null

          beforeEach(function () {
            user = {
              send: sinon.stub()
            }

            sinon.stub(logger, 'warn')

            return broadcast(user, payload, {request})
          })

          afterEach(function () {
            logger.warn.restore()
          })

          it('should not send the payload', function () {
            assert.strictEqual(user.send.calledOnce, false)
          })

          it('should log the http request info', function () {
            assert.strictEqual(logger.warn.calledOnce, true)
            assert.strictEqual(logger.warn.getCall(0).args[1], request.meta)
          })
        })
      })
    })
  })
})
