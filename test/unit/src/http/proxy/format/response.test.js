import {dotEnvConfig} from '../../../../../deps.ts'
dotEnvConfig({ export: true })

import { gzipDecode } from '../../../../../deps.ts'
import { Buffer } from '../../../../../deps.ts'
import { assert, assertEquals } from '../../../../../deps.ts'

import normalize from '../../../../../../src/http/proxy/format/response.js'

let ContentType = 'image/gif'
let ETag = 'etagvalue'
let fileContents = 'this is just some file contents\n'
let body = Buffer.from(fileContents)
function basicResponse () {
  return {
    // Generated response object
    response: {
      headers: {
        'Content-Type': ContentType,
        'Cache-Control': 'max-age=86400',
        ETag
      },
      body
    },
    // S3 result object
    result: {
      ContentType,
      ETag,
      Body: body
    },
    Key: 'this-is-fine.gif',
    isProxy: false,
    config: { spa: true }
  }
}

Deno.test({
  name: 'Set up env', 
  fn: () => {
    //t.plan(1)
    assert(normalize, 'Loaded normalize')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Content-Type setting', 
  fn: () => {
    //t.plan(11)
    let _basicResponse = basicResponse()
    let result = normalize(_basicResponse)
    assertEquals(result.headers['Content-Type'], ContentType, `Retained Content-Type from Content-Type header: ${ContentType}`)

    delete _basicResponse.response.headers['Content-Type']
    assertEquals(_basicResponse.response.headers['Content-Type'], undefined, `headers['Content-Type'] removed`)
    _basicResponse.response.headers['content-type'] = ContentType
    result = normalize(_basicResponse)
    assertEquals(result.headers['Content-Type'], ContentType, `Retained Content-Type from content-type header: ${ContentType}`)

    delete _basicResponse.response.headers['Content-Type']
    delete _basicResponse.response.headers['content-type']
    assertEquals(_basicResponse.response.headers['Content-Type'], undefined, `headers['Content-Type'] removed`)
    assertEquals(_basicResponse.response.headers['content-type'], undefined, `headers['content-type'] removed`)
    result = normalize(_basicResponse)
    assertEquals(result.headers['Content-Type'], ContentType, `Retained Content-Type from result.ContentType param: ${ContentType}`)
    assertEquals(result.headers['content-type'], undefined, `Lower-case content-type header not present: ${ContentType}`)

    delete _basicResponse.result.ContentType
    delete _basicResponse.response.headers['Content-Type']
    delete _basicResponse.response.headers['content-type']
    assertEquals(_basicResponse.response.headers['Content-Type'], undefined, `headers['Content-Type'] removed`)
    assertEquals(_basicResponse.response.headers['content-type'], undefined, `headers['content-type'] removed`)
    assertEquals(_basicResponse.result.ContentType, undefined, `result.ContentType removed`)
    result = normalize(_basicResponse)
    assertEquals(result.headers['Content-Type'], ContentType, `Inferred Content-Type from filename: ${ContentType}`)
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Cache-Control setting', 
  fn: () => {
    //t.plan(5)
    let _basicResponse = basicResponse()
    let result = normalize(_basicResponse)
    assertEquals(result.headers['Cache-Control'], 'public, max-age=0, must-revalidate', 'No anti-cache or cache setting set, defaults to 1 day')

    // Test anti-cache
    // JSON
    _basicResponse.response.headers['Content-Type'] = 'application/json'
    result = normalize(_basicResponse)
    assert(result.headers['Cache-Control'].includes('no-cache'), 'JSON responses are anti-cached')

    // JSON API
    _basicResponse.response.headers['Content-Type'] = 'application/vnd.api+json'
    result = normalize(_basicResponse)
    assert(result.headers['Cache-Control'].includes('no-cache'), 'JSON API responses are anti-cached')

    // HTML
    _basicResponse.response.headers['Content-Type'] = 'text/html'
    result = normalize(_basicResponse)
    assert(result.headers['Cache-Control'].includes('no-cache'), 'HTML responses are anti-cached')

    // cacheControl param sets Cache-Control (and overrides anti-cache)
    _basicResponse.config.cacheControl = 'meh'
    result = normalize(_basicResponse)
    assert(result.headers['Cache-Control'].includes('meh'), 'cacheControl setting is respected and wins over anti-cache logic')
  },
  sanitizeResources: false,
  sanitizeOps: false

})

Deno.test({
  name: 'Response encoding', 
  fn: () => {
    //t.plan(29)
    function usually (extras) {
      let _basicResponse = basicResponse()
      if (extras) _basicResponse = Object.assign(_basicResponse, extras)
      let result = normalize(_basicResponse)
      let resultBody
      if (result.headers['Content-Encoding'] === 'gzip') {
        const decoder = new TextDecoder()
        resultBody = decoder.decode(gzipDecode(Buffer.from(result.body, 'base64')))
      }
      else {
        resultBody = Buffer.from(result.body, 'base64').toString()
      }
      assert(result.headers['Content-Type'], 'Got Content-Type header')
      assert(result.headers['Cache-Control'], 'Got Cache-Control header')
      assertEquals(resultBody, fileContents, 'Body matches provided file contents')
      assert(result.isBase64Encoded, 'Got isBase64Encoded param')
      assertEquals(Object.getOwnPropertyNames(result).length, 3, 'Received correctly formatted response')
    }

    // Arc 6
    Deno.env.set('ARC_CLOUDFORMATION', 'true')
    assert(Deno.env.get('ARC_CLOUDFORMATION'), 'In Arc 6 mode')
    usually()

    // Arc 6 + compression
    usually({ contentEncoding: 'gzip' })
    Deno.env.delete('ARC_CLOUDFORMATION')
    assertEquals(Deno.env.get('ARC_CLOUDFORMATION'), undefined, 'No longer in Arc 6 mode')

    // Arc Sandbox
    Deno.env.set('ARC_HTTP', 'aws_proxy')
    assert(Deno.env.get('ARC_HTTP'), 'In sandbox mode')
    usually()
    Deno.env.delete('ARC_HTTP')
    assertEquals(Deno.env.get('ARC_HTTP'), undefined, 'No longer in sandbox mode')

    // Arc 5 HTML
    assert(!Deno.env.get('ARC_CLOUDFORMATION') && !Deno.env.get('ARC_HTTP'), 'In Arc 5 mode (not a proxy request)')
    let _basicResponse = basicResponse()
    let html = 'text/html'
    _basicResponse.response.headers['Content-Type'] = html
    let result = normalize(_basicResponse)
    assertEquals(result.headers['Content-Type'], html, 'Got expected Content-Type header')
    assert(result.headers['Cache-Control'], 'Got Cache-Control header')
    assertEquals(result.body, fileContents, 'Body matches provided file contents (no encoding)')
    assertEquals(result.type, 'text/html', 'Returned response.type param')

    // Arc 5 !HTML
    usually()
  },
  sanitizeResources: false,
  sanitizeOps: false
})
