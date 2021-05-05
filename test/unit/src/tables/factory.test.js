import proxyquire from '../../../deps.ts'
import {assert, assertEquals, AssertionError} from '../../../deps.ts'

let fakeDb = {}
let fakeDoc = {}

let factory = proxyquire('../../../../src/tables/factory.js', {
  './dynamo': { db: {}, doc: {} },
  'run-parallel': (_, cb) => cb(null, { doc: fakeDoc, db: fakeDb })
})

Deno.test({
  name: 'tables.factory client properties', 
  fn: () => {
    //t.plan(3)
    let tables = { bat: 'country' }
    factory(tables, (err, client) => {
      if (err) AssertionError(err)
      assert(client._db === fakeDb, '_db property assigned')
      assert(client._doc === fakeDoc, '_doc property assigned')
      assert(client.bat, 'table name assigned')
    })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'tables.factory client static methods', 
  fn: () => {
    //t.plan(2)
    let tables = { quart: 'tequila' }
    factory(tables, async (err, client) => {
      if (err) AssertionError(err)
      assertEquals(await client.reflect(), tables, 'reflect() returns tables object')
      assertEquals(client._name('quart'), 'tequila', '_name() returns tables value')
    })
  },
  sanitizeResources: false,
  sanitizeOps: false
})
