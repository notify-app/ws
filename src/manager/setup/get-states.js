'use strict'

const logger = require('../../logger')
const notifyStore = require('../../store')

const stateMap = {
  Online: 'online',
  Offline: 'offline',
  Away: 'away'
}

/**
 * getStates stores the possible states a user can be in.
 * @param  {Object} master Master object.
 * @return {Promise}       Resolved with the possible states.
 */
module.exports = (master) => {
  logger.info('loading user states')

  return notifyStore.store.find(notifyStore.types.STATES)
    .then(({payload}) => {
      payload.records.forEach(state => {
        master.states[stateMap[state.name]] = state.id
      })
    })
}
