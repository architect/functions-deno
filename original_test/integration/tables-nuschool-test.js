import sandbox from '@architect/sandbox'
import {execSync as exec} from 'child_process'
import test from 'tape'
import { join, dirname } from 'path'
import { copyFileSync, existsSync as exists, mkdirSync as mkdir } from 'fs'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let arc
let data

let mock = join(__dirname, '..', 'mock')
let tmp = join(mock, 'tmp')
let shared = join(tmp, 'node_modules', '@architect', 'shared')

let origCwd = process.cwd()

test('Set up mocked files', async t => {
  t.plan(3)
  mkdir(shared, { recursive: true })
  copyFileSync(join(mock, 'mock-arc'), join(shared, '.arc'))
  copyFileSync(join(mock, 'mock-arc'), join(tmp, '.arc'))
  copyFileSync(join(mock, 'mock-static'), join(shared, 'static.json'))
  t.ok(exists(join(shared, '.arc')), 'Mock .arc (shared) file ready')
  t.ok(exists(join(tmp, '.arc')), 'Mock .arc (root) file ready')
  t.ok(exists(join(shared, 'static.json')), 'Mock static.json file ready')
  process.chdir(tmp)
  // eslint-disable-next-line
  //arc = require('../..') // module globally inspects arc file so need to require after chdir
  arc = await import('../../src/index.js')
  
})

test('starts the db server', t => {
  t.plan(1)
  sandbox.tables.start({}, err => {
    if (err) t.fail(err)
    else t.pass('Sandbox started')
  })
})

test('tables() returns table object', async t => {
  t.plan(2)
  data = await arc.tables()
  t.ok(data.accounts, 'accounts table object exists')
  t.ok(data.messages, 'messages table object exists')
})

test('tables put()', async t => {
  t.plan(1)
  let item = await data.accounts.put({
    accountID: 'fake',
    foo: 'bar',
    baz: {
      one: 1,
      doe: true
    }
  })
  t.ok(item, 'returned item')
})

test('tables get()', async t => {
  t.plan(2)
  let result = await data.accounts.get({
    accountID: 'fake'
  })
  t.ok(result, 'got result')
  t.ok(result.baz.doe, 'result.baz.doe deserialized')
})

test('tables delete()', async t => {
  t.plan(2)
  await data.accounts.delete({
    accountID: 'fake'
  })
  t.ok(true, 'deleted')
  let result = await data.accounts.get({
    accountID: 'fake'
  })
  t.equals(result, undefined, 'got undefined result')
})

test('tables query()', async t => {
  t.plan(3)
  let items = await Promise.all([
    data.accounts.put({ accountID: 'one' }),
    data.accounts.put({ accountID: 'two' }),
    data.accounts.put({ accountID: 'three' }),
  ])

  t.ok(items, 'got items')

  let result = await data.accounts.query({
    KeyConditionExpression: 'accountID = :id',
    ExpressionAttributeValues: {
      ':id': 'one',
    }
  })

  t.ok(result, 'got a result')
  t.equals(result.Count, 1, 'got count of one')
})

test('tables scan()', async t => {
  t.plan(1)
  let result = await data.accounts.scan({
    FilterExpression: 'accountID = :id',
    ExpressionAttributeValues: {
      ':id': 'two'
    }
  })
  t.ok(result, 'got a result')
})

test('tables update()', async t => {
  t.plan(3)
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

  t.ok(true, 'updated without error')

  let result = await data.accounts.get({
    accountID: 'three'
  })

  t.ok(result, 'got result')
  t.equals(result.hits, 20, 'property updated')
})

test('server closes', t => {
  t.plan(1)
  sandbox.tables.end(err => {
    if (err) t.fail(err)
    else t.pass('Sandbox ended')
  })
})

test('Clean up env', t => {
  t.plan(1)
  process.env.NODE_ENV = 'testing'
  process.chdir(origCwd)
  exec(`rm -rf ${tmp}`)
  t.ok(!exists(tmp), 'Mocks cleaned up')
})
