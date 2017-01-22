'use strict'

const assert = require('assert')
const serialize = require('../../src/ipc-events/utils/serialize')

describe('Record Serialization Functionality', function () {
  describe('Scenario: Serializing a record:', function () {
    describe('Given a FortuneJS record,', function () {
      let record = null

      beforeEach(function () {
        record = {
          id: 'u1',
          name: 'luca',
          surname: 'tabone',
          token: 't1',
          messages: [ 'm1', 'm2' ]
        }
      })

      describe('when serialized to JSONAPI', function () {
        let rels = null
        let recordType = null
        let serialized = null

        beforeEach(function () {
          recordType = 'user'
          const attrs = ['name', 'surname']
          rels = [
            { key: 'token', type: 'token-type' },
            { key: 'messages', type: 'message-type' }
          ]

          serialized = serialize(record, recordType, attrs, rels)
        })

        it('should serialize the record accordingly', function () {
          const expected = {
            data: {
              id: record.id,
              type: recordType,
              attributes: {
                name: record.name,
                surname: record.surname
              },
              relationships: {
                token: {
                  data: { type: rels[0].type, id: record.token }
                },
                messages: {
                  data: [
                    { type: rels[1].type, id: record.messages[0] },
                    { type: rels[1].type, id: record.messages[1] }
                  ]
                }
              }
            }
          }

          assert.strictEqual(serialized, JSON.stringify(expected))
        })
      })
    })
  })
})
