'use strict'

const assert = require('assert')
const sinon = require('sinon')
const utils = require('../../src/ipc-events/utils')
const messageListener = require('../../src/ipc-events/models/messages')

describe('IPC-Emitter Listener Messages', function () {
  describe('Scenario: Sending a message in a room:', function () {
    describe('Given a WebSocket Manager instance,', function () {
      let manager = null

      beforeEach(function () {
        manager = {}
      })

      describe('with a number of rooms & users,', function () {
        let userAInRoomA = null
        let userBInRoomA = null
        let userCInRoomB = null

        beforeEach(function () {
          userAInRoomA = { id: 'u1' }
          userBInRoomA = { id: 'u2' }
          userCInRoomB = { id: 'u3' }

          manager.users = {
            'u1': userAInRoomA,
            'u2': userBInRoomA,
            'u3': userCInRoomB
          }

          manager.rooms = {
            'r1': [ userAInRoomA, userBInRoomA ],
            'r2': [ userCInRoomB ]
          }
        })

        describe('when a user sends a message inside a room:', function () {
          let message = null
          let context = null
          let serializedMessage = null

          beforeEach(function () {
            context = {}
            message = { room: 'r1' }
            serializedMessage = {}

            sinon.stub(utils, 'serialize').returns(serializedMessage)
            sinon.stub(utils, 'broadcast')

            messageListener(manager)(message, context)
          })

          afterEach(function () {
            utils.serialize.restore()
            utils.broadcast.restore()
          })

          it('should serialize the message to be sent to JSONAPI', function () {
            assert.strictEqual(utils.serialize.calledOnce, true)
            assert.strictEqual(utils.serialize.getCall(0).args[0],
              message)
            assert.strictEqual(utils.serialize.getCall(0).args[1],
              utils.types.MESSAGES)
            assert.deepStrictEqual(utils.serialize.getCall(0).args[2], [
              'content', 'deleted'
            ])
            assert.deepStrictEqual(utils.serialize.getCall(0).args[3][0], {
              key: 'user', type: utils.types.USERS
            })
            assert.deepStrictEqual(utils.serialize.getCall(0).args[3][1], {
              key: 'room', type: utils.types.ROOMS
            })
          })

          it('should only notify users in the room', function () {
            assert.strictEqual(utils.broadcast.callCount,
              manager.rooms[message.room].length)
            assert.deepStrictEqual(utils.broadcast.getCall(0).args, [
              userAInRoomA,
              serializedMessage,
              context
            ])
            assert.deepStrictEqual(utils.broadcast.getCall(1).args, [
              userBInRoomA,
              serializedMessage,
              context
            ])
          })
        })
      })
    })
  })
})
