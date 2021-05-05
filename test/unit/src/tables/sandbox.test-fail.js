import proxyquire from '../../../deps.ts'
import {assert, AssertionError} from '../../../deps.ts'

let fakeDoc = {}
let fakeTables = { TableNames: [] }
let fakeDb = { listTables: (_, cb) => cb(null, fakeTables) }
const appname = 'testapp'
function buildTables (arr) {
  arr.push('arc-sessions')
  let tables = []
  arr.forEach(t => {
    tables.push(`${appname}-staging-${t}`)
    tables.push(`${appname}-production-${t}`)
  })
  return tables
}

let sandbox = proxyquire('../../../../src/tables/sandbox.js', {
  './dynamo': { db: {}, doc: {} },
  'run-parallel': (_, cb) => cb(null, [ fakeDb, fakeDoc ])
})

Deno.test({
  name: 'tables.sandbox should return a client/object with properties for each user-defined table', 
  fn: () => {
    //t.plan(4)
    fakeTables.TableNames = buildTables([ 'accounts', 'posts' ])
    sandbox((err, client) => {
      if (err) AssertionError(err)
      assert(client._db === fakeDb, '_db property assigned')
      assert(client._doc === fakeDoc, '_doc property assigned')
      assert(client.accounts, 'first user-defined table created')
      assert(client.posts, 'second user-defined table created')
    })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'tables.sandbox should return a client/object with properties for user-defined tables using arc reserved-ish names like staging and production', 
  fn: () => {
    //t.plan(2)
    fakeTables.TableNames = buildTables([ 'stagings', 'productions' ])
    sandbox((err, client) => {
      if (err) AssertionError(err)
      assert(client.stagings, '"stagings" user-defined table created')
      assert(client.productions, '"productions" user-defined table created')
    })
  },
  sanitizeResources: false,
  sanitizeOps: false
})
