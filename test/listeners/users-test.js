'use strict'

const assert = require('assert')
const sinon = require('sinon')
const utils = require('../../src/ipc-events/utils')
const userListener = require('../../src/ipc-events/models/users')

describe('IPC-Emitter Listener Users', function () {
  describe('Scenario: Creating/Updating a user:', function () {
    describe('Given a WebSocket Manager instance,', function () {
      let manager = null

      beforeEach(function () {
        manager = {
          addUserToRoom: sinon.stub()
        }
      })

      describe('with a number of rooms & users,', function () {
        let userAInRoomA = null
        let userBInRoomA = null
        let userCInRoomB = null

        beforeEach(function () {
          userAInRoomA = { id: 'u1', rooms: ['r1', 'r2'] }
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

        describe('when a user is created/modified:', function () {
          let context = null
          let serializedUser = null

          beforeEach(function () {
            context = {}
            serializedUser = {}

            sinon.stub(utils, 'serialize').returns(serializedUser)
            sinon.stub(utils, 'broadcast')

            userListener(manager)(userAInRoomA, context)
          })

          afterEach(function () {
            utils.serialize.restore()
            utils.broadcast.restore()
          })

          it('should include the user inside the rooms he is part of', function () {
            assert.strictEqual(manager.addUserToRoom.callCount,
              userAInRoomA.rooms.length)
            assert.deepStrictEqual(manager.addUserToRoom.getCall(0).args, [
              userAInRoomA.rooms[0], userAInRoomA
            ])
            assert.deepStrictEqual(manager.addUserToRoom.getCall(1).args, [
              userAInRoomA.rooms[1], userAInRoomA
            ])
          })

          it('should serialize the user to be sent to JSONAPI', function () {
            assert.strictEqual(utils.serialize.calledOnce, true)
            assert.strictEqual(utils.serialize.getCall(0).args[0],
              userAInRoomA)
            assert.strictEqual(utils.serialize.getCall(0).args[1],
              utils.types.USERS)
            assert.deepStrictEqual(utils.serialize.getCall(0).args[2], [
              'username', 'image', 'bot'
            ])
            assert.deepStrictEqual(utils.serialize.getCall(0).args[3][0], {
              key: 'rooms', type: utils.types.ROOMS
            })
            assert.deepStrictEqual(utils.serialize.getCall(0).args[3][1], {
              key: 'state', type: utils.types.STATES
            })
            assert.deepStrictEqual(utils.serialize.getCall(0).args[3][2], {
              key: 'messages', type: utils.types.MESSAGES
            })
          })

          it('should notify all the users', function () {
            assert.strictEqual(utils.broadcast.callCount,
              Object.keys(manager.users).length)
            assert.deepStrictEqual(utils.broadcast.getCall(0).args, [
              userAInRoomA,
              serializedUser,
              context
            ])
            assert.deepStrictEqual(utils.broadcast.getCall(1).args, [
              userBInRoomA,
              serializedUser,
              context
            ])
            assert.deepStrictEqual(utils.broadcast.getCall(2).args, [
              userCInRoomB,
              serializedUser,
              context
            ])
          })
        })
      })
    })
  })
})
