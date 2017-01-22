'use strict'

const assert = require('assert')
const sinon = require('sinon')
const notifyStore = require('../src/store')
const manager = require('../src/manager')
let managerInst = null

describe('WebSocket Manager', function () {
  beforeEach(function () {
    managerInst = Object.create(manager)
  })

  describe('Scenario: Initializing WebSocket Manager:', function () {
    describe('When initializing a WebSocket Manager instance:', function () {
      let payload = null

      beforeEach(function () {
        payload = {
          payload: {
            records: [
              { id: 's1', name: 'Online' },
              { id: 's2', name: 'Offline' },
              { id: 's3', name: 'Away' }
            ]
          }
        }

        sinon.stub(notifyStore.store, 'find').returns(Promise.resolve(payload))

        return managerInst.init()
      })

      it('should query and cache the states', function () {
        assert.strictEqual(notifyStore.store.find.calledOnce, true)
        assert.deepStrictEqual(managerInst.states, {
          'online': 's1',
          'offline': 's2',
          'away': 's3'
        })
      })
    })
  })

  describe('Scenario: Adding a user:', function () {
    describe('Given a Manager Instance,', function () {
      beforeEach(function () {
        managerInst.states = {
          'online': 's1',
          'offline': 's2',
          'away': 's3'
        }
      })

      describe('with some rooms & users,', function () {
        let userB = null
        let userC = null

        beforeEach(function () {
          userB = {
            upgradeReq: {
              notify: { user: { id: 'u2', rooms: ['r1'] } }
            }
          }

          userC = {
            upgradeReq: {
              notify: { user: { id: 'u3', rooms: ['r2'] } }
            }
          }

          managerInst.users = {
            'u2': userB,
            'u3': userC
          }

          managerInst.rooms = {
            'r1': [ userB ],
            'r2': [ userC ]
          }

          sinon.stub(notifyStore.store, 'update').returns(Promise.resolve())
        })

        afterEach(function () {
          notifyStore.store.update.restore()
        })

        describe('when adding a user to the list of online users:', function () {
          let userA = null

          beforeEach(function () {
            userA = {
              on: sinon.stub(),
              upgradeReq: {
                notify: { user: { id: 'u1', rooms: ['r1', 'r3'] } }
              }
            }

            return managerInst.addUser(userA)
          })

          it('should update his online status', function () {
            assert.strictEqual(notifyStore.store.update.calledOnce, true)
            assert.strictEqual(notifyStore.store.update.getCall(0).args[0],
              notifyStore.types.USERS)
            assert.strictEqual(notifyStore.store.update.getCall(0).args[1].id,
              userA.upgradeReq.notify.user.id)
            assert.strictEqual(notifyStore.store.update.getCall(0).args[1]
              .replace.state, managerInst.states.online)
          })

          it('should add a listener to the close event of the socket', function () {
            assert.strictEqual(userA.on.calledOnce, true)
            assert.strictEqual(userA.on.getCall(0).args[0], 'close')
            assert.strictEqual(typeof userA.on.getCall(0).args[1], 'function')
          })

          it('should add the user to the list of online users', function () {
            assert.strictEqual(managerInst
              .users[userA.upgradeReq.notify.user.id], userA)
          })

          it('should include the user in rooms he is a member of', function () {
            assert.strictEqual(managerInst.rooms['r1'].indexOf(userA), 1)
            assert.strictEqual(managerInst.rooms['r2'].indexOf(userA), -1)
            assert.strictEqual(managerInst.rooms['r3'].indexOf(userA), 0)
          })
        })
      })
    })
  })

  describe('Scenario: Disconnecting user:', function () {
    describe('Given a Manager Instance,', function () {
      beforeEach(function () {
        managerInst.states = {
          'online': 's1',
          'offline': 's2',
          'away': 's3'
        }
      })

      describe('with some rooms & users,', function () {
        let userA = null

        beforeEach(function () {
          userA = {
            on: sinon.stub(),
            upgradeReq: {
              notify: { user: { id: 'u1', rooms: ['r1', 'r3'] } }
            }
          }

          sinon.stub(notifyStore.store, 'update').returns(Promise.resolve())

          return managerInst.addUser(userA)
            .then(() => notifyStore.store.update.reset())
        })

        afterEach(function () {
          notifyStore.store.update.restore()
        })

        describe('when the user disconnects:', function () {
          beforeEach(function () {
            userA.on.getCall(0).args[1]()
          })

          it('should change his status to offline', function () {
            assert.strictEqual(notifyStore.store.update.calledOnce, true)
            assert.strictEqual(notifyStore.store.update.getCall(0).args[0],
              notifyStore.types.USERS)
            assert.strictEqual(notifyStore.store.update.getCall(0).args[1].id,
              userA.upgradeReq.notify.user.id)
            assert.strictEqual(notifyStore.store.update.getCall(0).args[1]
              .replace.state, managerInst.states.offline)
          })

          it('should remove the user from the list of online users', function () {
            assert.strictEqual(managerInst.users['u1'], undefined)
          })

          it('should remove the user from the rooms he is a member of', function () {
            assert.strictEqual(managerInst.rooms['r1'], undefined)
            assert.strictEqual(managerInst.rooms['r3'], undefined)
          })
        })
      })
    })
  })

  // describe('Scenario: Disconnecting a user:')

  describe('Scenario: Adding a user to a room:', function () {
    describe('Given a Manager Instance,', function () {
      describe('with some rooms & users,', function () {
        let userA = null
        let userB = null
        let userC = null

        beforeEach(function () {
          userA = {
            upgradeReq: {
              notify: { user: { id: 'u1', rooms: ['r1'] } }
            }
          }

          userB = {
            upgradeReq: {
              notify: { user: { id: 'u2', rooms: ['r1'] } }
            }
          }

          userC = {
            upgradeReq: {
              notify: { user: { id: 'u3', rooms: ['r2'] } }
            }
          }

          managerInst.users = {
            'u1': userA,
            'u2': userB,
            'u3': userC
          }

          managerInst.rooms = {
            'r1': [ userA, userB ],
            'r2': [ userC ]
          }
        })

        describe('when adding a user to a room:', function () {
          beforeEach(function () {
            managerInst.addUserToRoom('r2', userA)
          })

          it('should add the user inside the room', function () {
            assert.strictEqual(managerInst.rooms['r2'].indexOf(userA), 1)
          })
        })
      })
    })
  })

  describe('Scenario: Adding a user to a room he is already in:', function () {
    describe('Given a Manager Instance,', function () {
      describe('with some rooms & users,', function () {
        let userA = null
        let userB = null
        let userC = null

        beforeEach(function () {
          userA = {
            upgradeReq: {
              notify: { user: { id: 'u1', rooms: ['r1'] } }
            }
          }

          userB = {
            upgradeReq: {
              notify: { user: { id: 'u2', rooms: ['r1'] } }
            }
          }

          userC = {
            upgradeReq: {
              notify: { user: { id: 'u3', rooms: ['r2'] } }
            }
          }

          managerInst.users = {
            'u1': userA,
            'u2': userB,
            'u3': userC
          }

          managerInst.rooms = {
            'r1': [ userA, userB ],
            'r2': [ userC ]
          }
        })

        describe('when adding a user to a room he is already in:', function () {
          beforeEach(function () {
            managerInst.addUserToRoom('r1', userA)
          })

          it('should not add the user inside that room', function () {
            assert.strictEqual(managerInst.rooms['r1'].length, 2)
          })
        })
      })
    })
  })

  describe('Scenario: Removing a user:', function () {
    describe('Given a Manager Instance,', function () {
      describe('with some rooms & users,', function () {
        let userA = null
        let userB = null
        let userC = null

        beforeEach(function () {
          userA = {
            upgradeReq: {
              notify: { user: { id: 'u1', rooms: ['r1'] } }
            }
          }

          userB = {
            upgradeReq: {
              notify: { user: { id: 'u2', rooms: ['r1'] } }
            }
          }

          userC = {
            upgradeReq: {
              notify: { user: { id: 'u3', rooms: ['r2'] } }
            }
          }

          managerInst.users = {
            'u1': userA,
            'u2': userB,
            'u3': userC
          }

          managerInst.rooms = {
            'r1': [ userA, userB ],
            'r2': [ userC ]
          }
        })

        describe('when removing a user:', function () {
          beforeEach(function () {
            managerInst.removeUser(userA)
          })

          it('should remove the user from the list of online users', function () {
            assert.strictEqual(managerInst.users[userA.id], undefined)
          })

          it('should remove the user from the rooms he is part of', function () {
            assert.strictEqual(managerInst.rooms['r1'].indexOf(userA), -1)
          })
        })
      })
    })
  })

  describe('Scenario: Removing a user from a room:', function () {
    describe('Given a Manager Instance,', function () {
      describe('with some rooms & users,', function () {
        let userA = null
        let userB = null
        let userC = null

        beforeEach(function () {
          userA = {
            upgradeReq: {
              notify: { user: { id: 'u1', rooms: ['r1'] } }
            }
          }

          userB = {
            upgradeReq: {
              notify: { user: { id: 'u2', rooms: ['r1'] } }
            }
          }

          userC = {
            upgradeReq: {
              notify: { user: { id: 'u3', rooms: ['r2'] } }
            }
          }

          managerInst.users = {
            'u1': userA,
            'u2': userB,
            'u3': userC
          }

          managerInst.rooms = {
            'r1': [ userA, userB ],
            'r2': [ userC ]
          }
        })

        describe('when removing a user from a room:', function () {
          beforeEach(function () {
            managerInst.removeUser(userA)
          })

          it('should remove the user from the rooms', function () {
            assert.strictEqual(managerInst.rooms['r1'].indexOf(userA), -1)
          })
        })
      })
    })
  })

  describe('Scenario: Removing a user from a that he is the only member of:', function () {
    describe('Given a Manager Instance,', function () {
      describe('with some rooms & users,', function () {
        let userA = null
        let userB = null
        let userC = null

        beforeEach(function () {
          userA = {
            upgradeReq: {
              notify: { user: { id: 'u1', rooms: ['r1'] } }
            }
          }

          userB = {
            upgradeReq: {
              notify: { user: { id: 'u2', rooms: ['r1'] } }
            }
          }

          userC = {
            upgradeReq: {
              notify: { user: { id: 'u3', rooms: ['r2'] } }
            }
          }

          managerInst.users = {
            'u1': userA,
            'u2': userB,
            'u3': userC
          }

          managerInst.rooms = {
            'r1': [ userA ],
            'r2': [ userC ]
          }
        })

        describe('when removing a user from a room that he is the only member of:', function () {
          beforeEach(function () {
            managerInst.removeUser(userA)
          })

          it('should remove the room entry from the WebSocket Manager instance', function () {
            assert.strictEqual(managerInst.rooms['r1'], undefined)
          })
        })
      })
    })
  })

  describe('Scenario: Removing all users from a room:', function () {
    describe('Given a Manager Instance,', function () {
      describe('with some rooms & users,', function () {
        let userA = null
        let userB = null
        let userC = null

        beforeEach(function () {
          userA = {
            upgradeReq: {
              notify: { user: { id: 'u1', rooms: ['r1'] } }
            }
          }

          userB = {
            upgradeReq: {
              notify: { user: { id: 'u2', rooms: ['r1'] } }
            }
          }

          userC = {
            upgradeReq: {
              notify: { user: { id: 'u3', rooms: ['r2'] } }
            }
          }

          managerInst.users = {
            'u1': userA,
            'u2': userB,
            'u3': userC
          }

          managerInst.rooms = {
            'r1': [ userA, userB ],
            'r2': [ userC ]
          }
        })

        describe('when removing a user from a room:', function () {
          beforeEach(function () {
            managerInst.clearUsersFromRoom('r1')
          })

          it('should remove the room entry from the WebSocket Manager instance', function () {
            assert.strictEqual(managerInst.rooms['r1'], undefined)
          })
        })
      })
    })
  })
})
