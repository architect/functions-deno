import arcHttpSync from '../../../../../../src/http/async/index.js'

function _handler (req, res) {
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
  res({
    session,
    json: JSON.stringify(session)
  })
}

export const handler = arcHttpSync(_handler)
