'use strict'

const assert = require('assert')
const sinon = require('sinon')
const utils = require('../../src/ipc-events/utils')
const roomListener = require('../../src/ipc-events/models/rooms')

describe('IPC-Emitter Listener Rooms', function () {
  describe('Scenario: Creating/Updating a room:', function () {
    describe('Given a WebSocket Manager instance:', function () {
      let manager = null

      beforeEach(function () {
        manager = {
          addUserToRoom: sinon.stub(),
          clearUsersFromRoom: sinon.stub()
        }
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

        describe('when a room is created or modified', function () {
          let room = null
          let context = null
          let serializedRoom = null

          beforeEach(function () {
            context = {}
            serializedRoom = {}
            room = { id: 'r1', users: [ userAInRoomA.id, userBInRoomA.id ] }

            sinon.stub(utils, 'serialize').returns(serializedRoom)
            sinon.stub(utils, 'broadcast')

            roomListener(manager)(room, context)
          })

          afterEach(function () {
            utils.serialize.restore()
            utils.broadcast.restore()
          })

          it('should clear the room from any users it might have', function () {
            assert.strictEqual(manager.clearUsersFromRoom.calledOnce, true)
          })

          it('should re-include the users who are in the room', function () {
            assert.strictEqual(manager.addUserToRoom.callCount,
              room.users.length)

            assert.strictEqual(manager.addUserToRoom
              .calledAfter(manager.clearUsersFromRoom), true)

            assert.deepStrictEqual(manager.addUserToRoom.getCall(0).args, [
              room.id,
              userAInRoomA
            ])

            assert.deepStrictEqual(manager.addUserToRoom.getCall(1).args, [
              room.id,
              userBInRoomA
            ])
          })

          it('should serialize the room to be sent to JSONAPI', function () {
            assert.strictEqual(utils.serialize.calledOnce, true)
            assert.strictEqual(utils.serialize.getCall(0).args[0],
              room)
            assert.strictEqual(utils.serialize.getCall(0).args[1],
              utils.types.ROOMS)
            assert.deepStrictEqual(utils.serialize.getCall(0).args[2], [
              'name', 'image', 'private'
            ])
            assert.deepStrictEqual(utils.serialize.getCall(0).args[3][0], {
              key: 'users', type: utils.types.USERS
            })
            assert.deepStrictEqual(utils.serialize.getCall(0).args[3][1], {
              key: 'messages', type: utils.types.MESSAGES
            })
          })

          it('should only notify users in the room', function () {
            assert.strictEqual(utils.broadcast.callCount,
              manager.rooms[room.id].length)
            assert.deepStrictEqual(utils.broadcast.getCall(0).args, [
              userAInRoomA,
              serializedRoom,
              context
            ])
            assert.deepStrictEqual(utils.broadcast.getCall(1).args, [
              userBInRoomA,
              serializedRoom,
              context
            ])
          })
        })
      })
    })
  })
})
