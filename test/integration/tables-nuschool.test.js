import arcTables from '../../src/tables/index.js'

import {path} from "../deps.ts"
import {
  assert,
  assertEquals,
} from "../deps.ts"
import { exists } from "../deps.ts"
import { DenoSandbox, read } from "../deps.ts"

const join = path.join
const __dirname = path.dirname(path.fromFileUrl(import.meta.url))

let arc
let data

let mock = join(__dirname, '..', 'mock')
let tmp = join(mock, 'tmp')
let shared = join(tmp, 'vendor', 'shared')

Deno.env.set('NODE_ENV', 'testing')
const sandbox = new DenoSandbox(false, tmp, Deno.env.toObject());

let origCwd = Deno.cwd()

Deno.test({
  name: 'Set up mocked files', 
  fn: async () => {
    //t.plan(3)
    
    await Deno.mkdir(shared, { recursive: true })
    await Deno.copyFile(join(mock, 'mock-arc'), join(shared, '.arc'))
    await Deno.copyFile(join(mock, 'mock-arc'), join(tmp, '.arc'))
    await Deno.copyFile(join(mock, 'mock-static'), join(shared, 'static.json'))
    
    assertEquals(await exists(join(shared, '.arc')), true, 'Mock .arc (shared) file ready')
    assertEquals(await exists(join(tmp, '.arc')), true, 'Mock .arc (root) file ready')
    assertEquals(await exists(join(shared, 'static.json')), true, 'Mock static.json file ready')
    Deno.chdir(tmp)
  },
  sanitizeResources: false,
  sanitizeOps: false
})


Deno.test({
  name: 'starts the db server', 
  fn: async () => {
    //t.plan(1)
    const cmd = sandbox.start();
    let result
    let checkComplete = false
    while(!checkComplete) {
      let line = await read(cmd.stdout)
      
      if(line.indexOf('Local environment ready!') !== -1) {
          checkComplete = true
          result = line
      }
    }

    assertEquals(result, '❤︎ Local environment ready!', result)
  },
  sanitizeResources: false,
  sanitizeOps: false,
})

Deno.test('tables() returns table object', async () => {
  //t.plan(2)
  data = await arcTables()
  //console.log(data)
  assert(data.accounts, 'accounts table object exists')
  assert(data.messages, 'messages table object exists')
})

Deno.test('tables put()', async () => {
  //t.plan(1)
  let item = await data.accounts.put({
    accountID: 'fake',
    foo: 'bar',
    baz: {
      one: 1,
      doe: true
    }
  })
  assert(item, 'returned item')
})


Deno.test('tables get()', async () => {
  //t.plan(2)
  let result = await data.accounts.get({
    accountID: 'fake'
  })
  assert(result, 'got result')
  assert(result.baz.doe, 'result.baz.doe deserialized')
})

Deno.test('tables delete()', async () => {
  //t.plan(2)
  await data.accounts.delete({
    accountID: 'fake'
  })
  assert(true, 'deleted')
  let result = await data.accounts.get({
    accountID: 'fake'
  })
  assertEquals(result, undefined, 'got undefined result')
})

Deno.test('tables query()', async () => {
  //t.plan(3)
  let items = await Promise.all([
    data.accounts.put({ accountID: 'one' }),
    data.accounts.put({ accountID: 'two' }),
    data.accounts.put({ accountID: 'three' }),
  ])

  assert(items, 'got items')

  let result = await data.accounts.query({
    KeyConditionExpression: 'accountID = :id',
    ExpressionAttributeValues: {
      ':id': 'one',
    }
  })

  assert(result, 'got a result')
  assertEquals(result.Count, 1, 'got count of one')
})

Deno.test('tables scan()', async () => {
  //t.plan(1)
  let result = await data.accounts.scan({
    FilterExpression: 'accountID = :id',
    ExpressionAttributeValues: {
      ':id': 'two'
    }
  })
  assert(result, 'got a result')
})

Deno.test('tables update()', async () => {
  //t.plan(3)
  await data.accounts.update({
    Key: {
      accountID: 'three'
    },
    UpdateExpression: 'set #hits = :hits',
    ExpressionAttributeNames: {
      '#hits': 'hits'
    },
    ExpressionAttributeValues: {
      ':hits': 20,
    }
  })

  assert(true, 'updated without error')

  let result = await data.accounts.get({
    accountID: 'three'
  })

  assert(result, 'got result')
  assertEquals(result.hits, 20, 'property updated')
})

Deno.test('server closes', t => {
  //t.plan(1)
  
})

Deno.test({
  name: "Clean up env and close sandbox", 
  fn: async () => {
      sandbox.stop();

      Deno.env.set('NODE_ENV', 'testing')
    await Deno.chdir(origCwd)
    await Deno.remove(tmp, { recursive: true })
    assertEquals(await exists(tmp), false, 'Mocks cleaned up')
  },
  sanitizeResources: false,
  sanitizeOps: false
})


