'use strict'

/**
 * serialize the record to a JSONAPI compliant payload.
 * @param  {Object} record        The record to be serialized.
 * @param  {String} type          Record type.
 * @param  {Array}  attributes    Keys that should be serialized as attributes.
 * @param  {Array}  relationships Keys that should be serialized as
 *                                relationships.
 * @return {String}               Serialized payload.
 */
module.exports = (record, type, attributes = [], relationships = []) => {
  const payload = {
    data: {
      id: record.id,
      type: type,
      attributes: {},
      relationships: {}
    }
  }

  attributes.forEach(field => {
    payload.data.attributes[field] = record[field]
  })

  relationships.forEach(field => {
    const value = record[field.key]
    const rel = payload.data.relationships[field.key] = {}

    if (Array.isArray(value)) {
      rel.data = value.map(resourceID => {
        return {
          type: field.type,
          id: resourceID
        }
      })
    } else {
      rel.data = {
        type: field.type,
        id: record[field.key]
      }
    }
  })

  return JSON.stringify(payload)
}
