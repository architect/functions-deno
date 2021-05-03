import getIdx from '../../../../../src/http/session/providers/_get-idx.js'
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.93.0/testing/asserts.ts"

Deno.test({
  name: 'Set up env', 
  fn: () => {
    //t.plan(1)
    assert(getIdx, 'Got getIdx module')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Test some cookies', 
  fn: () => {
    //t.plan(7)
    let result
    let cookie
    let random = Math.random() + ''
    let idx = `_idx=${random}`

    result = getIdx()
    assertEquals(result, '', 'Passing nothing returns empty string')

    result = getIdx('')
    assertEquals(result, '', 'Passing empty string returns empty string')

    cookie = 'some random text'
    result = getIdx(cookie)
    assertEquals(result, '', 'Passing arbitrary non-cookie string returns empty string')

    cookie = 'key=value'
    result = getIdx(cookie)
    assertEquals(result, '', 'Passing non-matching cookie string returns empty string')

    cookie = idx
    result = getIdx(cookie)
    assertEquals(result, idx, `Passing single cookie string with _idx returns correct value: ${cookie}`)

    cookie = `key=value; ${idx}; anotherkey=anothervalue;`
    result = getIdx(cookie)
    assertEquals(result, idx, `Passing multiple cookies with one _idx returns correct value: ${idx}`)

    cookie = `key=value; _idx=foo; ${idx}; anotherkey=anothervalue;`
    result = getIdx(cookie)
    assertEquals(result, idx, `Passing multiple _idx cookies returns last cookie: ${idx}`)
  },
  sanitizeResources: false,
  sanitizeOps: false
})
