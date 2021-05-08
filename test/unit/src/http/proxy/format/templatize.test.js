import {dotEnvConfig} from '../../../../../deps.ts'
dotEnvConfig({ export: true })

import { Buffer } from '../../../../../deps.ts'
import { assert, assertEquals } from '../../../../../deps.ts'

import sut from '../../../../../../src/http/proxy/format/templatize.js'

let buf = b => Buffer.from(b)

Deno.test({
  name: 'Module is present', 
  fn: () => {
    //t.plan(1)
    assert(sut, 'Templatizer module is present')
  }, 
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Templatizer ignores binary responses', 
  fn: () => {
    //t.plan(1)
    let content = 'here is an asset: ${STATIC(\'this-is-fine.gif\')}'
    let response = { body: buf(content) }
    let result = sut({
      isBinary: true,
      response
    })
    assertEquals(content, result.body.toString(), 'Templatizer exited early')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Templatizer passes through non-fingerprinted assets', 
  fn: () => {
    //t.plan(6)
    let response = { body: buf('here is an asset: ${STATIC(\'this-is-fine.gif\')}') }
    let result = sut({ response }).body.toString()
    assertEquals(result.includes('${STATIC(\'this-is-fine.gif\')}'), false, 'Templatizer stripped out STATIC')
    assert(result.includes('this-is-fine.gif'), 'Templatizer left in asset reference')

    response = { body: buf('here is an asset: ${arc.static(\'this-is-fine.gif\')}') }
    result = sut({ response }).body.toString()
    assertEquals(result.includes('${arc.static(\'this-is-fine.gif\')}'), false, 'Templatizer stripped out arc.static')
    assert(result.includes('this-is-fine.gif'), 'Templatizer left in asset reference')

    response = { body: buf('here is an asset: ${arc.static(\'/this-is-fine.gif\')}') }
    result = sut({ response }).body.toString()
    assertEquals(result.includes('${arc.static(\'/this-is-fine.gif\')}'), false, 'Templatizer stripped out arc.static')
    assert(result.includes('/this-is-fine.gif'), 'Templatizer left in asset reference (including leading slash)')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Templatizer replaces fingerprinted assets', 
  fn: () => {
    //t.plan(6)
    let fingerprinted = 'this-is-fine-abc123.gif'
    let assets = {
      'this-is-fine.gif': fingerprinted
    }
    let response = { body: buf('here is an asset: ${STATIC(\'this-is-fine.gif\')}') }
    let result = sut({ response, assets }).body.toString()
    assertEquals(result.includes('${STATIC(\'this-is-fine.gif\')}'), false, 'Templatizer stripped out STATIC')
    assert(result.includes(fingerprinted), 'Templatizer replaced asset reference with fingerprint')

    response = { body: buf('here is an asset: ${arc.static(\'this-is-fine.gif\')}') }
    result = sut({ response, assets }).body.toString()
    assertEquals(result.includes('${arc.static(\'this-is-fine.gif\')}'), false, 'Templatizer stripped out arc.static')
    assert(result.includes(fingerprinted), 'Templatizer replaced asset reference with fingerprint')

    // Leading slash
    fingerprinted = '/this-is-fine-abc123.gif'
    response = { body: buf('here is an asset: ${arc.static(\'/this-is-fine.gif\')}') }
    result = sut({ response, assets }).body.toString()
    assertEquals(result.includes('${arc.static(\'/this-is-fine.gif\')}'), false, 'Templatizer stripped out arc.static')
    assert(result.includes(fingerprinted), 'Templatizer replaced asset reference with fingerprint (including leading slash)')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Templatizer does not replace fingerprinted assets locally', 
  fn: () => {
    //t.plan(6)
    let assets = {
      'this-is-fine.gif': 'this-is-fine-abc123.gif'
    }
    let isLocal = true
    let response = { body: buf('here is an asset: ${STATIC(\'this-is-fine.gif\')}') }
    let result = sut({ response, assets, isLocal }).body.toString()
    assertEquals(result.includes('${STATIC(\'this-is-fine.gif\')}'), false, 'Templatizer stripped out STATIC')
    assert(result.includes('this-is-fine.gif'), 'Templatizer replaced asset reference with fingerprint')

    response = { body: buf('here is an asset: ${arc.static(\'this-is-fine.gif\')}') }
    result = sut({ response, assets, isLocal }).body.toString()
    assertEquals(result.includes('${arc.static(\'this-is-fine.gif\')}'), false, 'Templatizer stripped out arc.static')
    assert(result.includes('this-is-fine.gif'), 'Templatizer replaced asset reference with fingerprint')

    response = { body: buf('here is an asset: ${arc.static(\'/this-is-fine.gif\')}') }
    result = sut({ response, assets, isLocal }).body.toString()
    assertEquals(result.includes('${arc.static(\'/this-is-fine.gif\')}'), false, 'Templatizer stripped out arc.static')
    assert(result.includes('/this-is-fine.gif'), 'Templatizer replaced asset reference with fingerprint (including leading slash)')
  },
  sanitizeResources: false,
  sanitizeOps: false
})
