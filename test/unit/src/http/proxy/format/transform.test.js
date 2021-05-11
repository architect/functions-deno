import {dotEnvConfig} from '../../../../../deps.ts'
dotEnvConfig({ export: true })

import { assert, assertEquals } from '../../../../../deps.ts'

import transform from '../../../../../../src/http/proxy/format/transform.js'

Deno.test({
  name: 'transform returns early if there are no plugins', 
  fn: () => {
    //t.plan(2)
    let headers = {}
    let body = `let foo = 1`
    let result = transform({
      Key: 'foo.mjs',
      config: {},
      defaults: { headers, body },
    })
    assertEquals(result.body, body, 'result.body is as expected')
    assertEquals(JSON.stringify(result.headers), JSON.stringify(headers), 'result.headers is as expected')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

function plugin0 (key, { headers, body }) {
  body = JSON.parse(body)
  body.zero = true
  return { headers, body: JSON.stringify(body) }
}
function plugin1 (key, { headers, body }) {
  body = JSON.parse(body)
  body.one = true
  return { headers, body: JSON.stringify(body) }
}
function plugin2 (key, { headers, body }) {
  body = JSON.parse(body)
  body.two = true
  return { headers, body: JSON.stringify(body) }
}

Deno.test({
  name: 'transforms', 
  fn: () => {
    //t.plan(4)
    let headers = {}
    let body = JSON.stringify({})
    let result = transform({
      Key: 'foo.json',
      config: {
        plugins: {
          json: [ plugin0, plugin1, plugin2 ],
        }
      },
      defaults: { headers, body },
    })
    let parsed = JSON.parse(result.body)
    assert(parsed, 'body')
    assert(parsed.zero, 'zero')
    assert(parsed.one, 'one')
    assert(parsed.two, 'two')
    console.log(parsed)
  },
  sanitizeResources: false,
  sanitizeOps: false
})
