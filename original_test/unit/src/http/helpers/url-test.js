import test from 'tape'
import url from '../../../../../src/http/helpers/url.js'
let env = process.env.NODE_ENV

function reset () {
  delete process.env.NODE_ENV
  delete process.env.ARC_LOCAL
  if (process.env.NODE_ENV) throw ReferenceError('NODE_ENV not unset')
}

test('Set up env', t => {
  t.plan(1)
  t.ok(url, 'url helper found')
})

test('Local (NODE_ENV=testing) env returns unmodified URL', t => {
  t.plan(1)
  reset()
  process.env.NODE_ENV = 'testing'
  let asset = url('foo.png')
  t.equal(asset, 'foo.png', 'Returned unmodified path')
})

test('Staging env returns staging-prefixed URL', t => {
  t.plan(1)
  reset()
  process.env.NODE_ENV = 'staging'
  let asset = url('/')
  t.equal(asset, '/staging/', 'Returned staging path')
})

test('Local env with staging mask (NODE_ENV=staging, ARC_LOCAL=1) returns unmodified path', t => {
  t.plan(1)
  reset()
  process.env.NODE_ENV = 'staging'
  process.env.ARC_LOCAL = '1'
  let asset = url('bar.png')
  t.equal(asset, 'bar.png', 'Returned staging path')
})

test('Production env returns production-prefixed URL', t => {
  t.plan(1)
  reset()
  process.env.NODE_ENV = 'production'
  let asset = url('/')
  t.equal(asset, '/production/', 'Returned staging path')
})

test('Reset', t => {
  reset()
  process.env.NODE_ENV = env
  t.end()
})
