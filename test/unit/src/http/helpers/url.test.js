import url from '../../../../../src/http/helpers/url.js'
import { assert, assertEquals } from '../../../../deps.ts'

let env = Deno.env.get('NODE_ENV')

function reset () {
  Deno.env.delete('NODE_ENV')
  Deno.env.delete('ARC_LOCAL')
  if (Deno.env.get('NODE_ENV')) throw ReferenceError('NODE_ENV not unset')
}

Deno.test({
  name: 'Set up env', 
  fn: () => {
    //t.plan(1)
    assert(url, 'url helper found')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Local (NODE_ENV=testing) env returns unmodified URL', 
  fn: () => {
    //t.plan(1)
    reset()
    Deno.env.set('NODE_ENV', 'testing')
    let asset = url('foo.png')
    assertEquals(asset, 'foo.png', 'Returned unmodified path')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Staging env returns staging-prefixed URL', 
  fn: () => {
    //t.plan(1)
    reset()
    Deno.env.set('NODE_ENV', 'staging')
    let asset = url('/')
    assertEquals(asset, '/staging/', 'Returned staging path')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Local env with staging mask (NODE_ENV=staging, ARC_LOCAL=1) returns unmodified path', 
  fn: () => {
    //t.plan(1)
    reset()
    Deno.env.set('NODE_ENV', 'staging')
    Deno.env.set('ARC_LOCAL', '1')
    let asset = url('bar.png')
    assertEquals(asset, 'bar.png', 'Returned staging path')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Production env returns production-prefixed URL', 
  fn: () => {
    //t.plan(1)
    reset()
    Deno.env.set('NODE_ENV', 'production')
    let asset = url('/')
    assertEquals(asset, '/production/', 'Returned staging path')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Reset', 
  fn: () => {
    reset()
    Deno.env.set('NODE_ENV', env)
    assertEquals(Deno.env.get('NODE_ENV'), env)
  },
  sanitizeResources: false,
  sanitizeOps: false
})
