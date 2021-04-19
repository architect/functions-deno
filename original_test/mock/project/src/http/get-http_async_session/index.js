import arcHttpSync from '../../../../../../src/http/async/index.js'

// eslint-disable-next-line
async function _handler (req) {
  let { query, session } = req
  if (query.session === 'create') {
    session.unique = new Date().toISOString()
  }
  if (query.session === 'update') {
    session.another = new Date().toISOString()
  }
  if (query.session === 'destroy') {
    session = {}
  }
  return {
    session,
    json: JSON.stringify(session)
  }
}

export const handler = arcHttpSync(_handler)
