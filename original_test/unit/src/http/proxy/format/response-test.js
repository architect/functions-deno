import test from 'tape'
import normalize from '../../../../../../src/http/proxy/format/response.js'
import { gunzipSync } from 'zlib'

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

test('Set up env', t => {
  t.plan(1)
  t.ok(normalize, 'Loaded normalize')
})

test('Content-Type setting', t => {
  t.plan(11)
  let _basicResponse = basicResponse()
  let result = normalize(_basicResponse)
  t.equal(result.headers['Content-Type'], ContentType, `Retained Content-Type from Content-Type header: ${ContentType}`)

  delete _basicResponse.response.headers['Content-Type']
  t.notOk(_basicResponse.response.headers['Content-Type'], `headers['Content-Type'] removed`)
  _basicResponse.response.headers['content-type'] = ContentType
  result = normalize(_basicResponse)
  t.equal(result.headers['Content-Type'], ContentType, `Retained Content-Type from content-type header: ${ContentType}`)

  delete _basicResponse.response.headers['Content-Type']
  delete _basicResponse.response.headers['content-type']
  t.notOk(_basicResponse.response.headers['Content-Type'], `headers['Content-Type'] removed`)
  t.notOk(_basicResponse.response.headers['content-type'], `headers['content-type'] removed`)
  result = normalize(_basicResponse)
  t.equal(result.headers['Content-Type'], ContentType, `Retained Content-Type from result.ContentType param: ${ContentType}`)
  t.notOk(result.headers['content-type'], `Lower-case content-type header not present: ${ContentType}`)

  delete _basicResponse.result.ContentType
  delete _basicResponse.response.headers['Content-Type']
  delete _basicResponse.response.headers['content-type']
  t.notOk(_basicResponse.response.headers['Content-Type'], `headers['Content-Type'] removed`)
  t.notOk(_basicResponse.response.headers['content-type'], `headers['content-type'] removed`)
  t.notOk(_basicResponse.result.ContentType, `result.ContentType removed`)
  result = normalize(_basicResponse)
  t.equal(result.headers['Content-Type'], ContentType, `Inferred Content-Type from filename: ${ContentType}`)
})

test('Cache-Control setting', t => {
  t.plan(5)
  let _basicResponse = basicResponse()
  let result = normalize(_basicResponse)
  t.equal(result.headers['Cache-Control'], 'public, max-age=0, must-revalidate', 'No anti-cache or cache setting set, defaults to 1 day')

  // Test anti-cache
  // JSON
  _basicResponse.response.headers['Content-Type'] = 'application/json'
  result = normalize(_basicResponse)
  t.ok(result.headers['Cache-Control'].includes('no-cache'), 'JSON responses are anti-cached')

  // JSON API
  _basicResponse.response.headers['Content-Type'] = 'application/vnd.api+json'
  result = normalize(_basicResponse)
  t.ok(result.headers['Cache-Control'].includes('no-cache'), 'JSON API responses are anti-cached')

  // HTML
  _basicResponse.response.headers['Content-Type'] = 'text/html'
  result = normalize(_basicResponse)
  t.ok(result.headers['Cache-Control'].includes('no-cache'), 'HTML responses are anti-cached')

  // cacheControl param sets Cache-Control (and overrides anti-cache)
  _basicResponse.config.cacheControl = 'meh'
  result = normalize(_basicResponse)
  t.ok(result.headers['Cache-Control'].includes('meh'), 'cacheControl setting is respected and wins over anti-cache logic')

})

test('Response encoding', t => {
  t.plan(29)
  function usually (extras) {
    let _basicResponse = basicResponse()
    if (extras) _basicResponse = Object.assign(_basicResponse, extras)
    let result = normalize(_basicResponse)
    let resultBody
    if (result.headers['Content-Encoding'] === 'gzip') {
      resultBody = gunzipSync(Buffer.from(result.body, 'base64')).toString()
    }
    else {
      resultBody = Buffer.from(result.body, 'base64').toString()
    }
    t.ok(result.headers['Content-Type'], 'Got Content-Type header')
    t.ok(result.headers['Cache-Control'], 'Got Cache-Control header')
    t.equal(resultBody, fileContents, 'Body matches provided file contents')
    t.ok(result.isBase64Encoded, 'Got isBase64Encoded param')
    t.equal(Object.getOwnPropertyNames(result).length, 3, 'Received correctly formatted response')
  }

  // Arc 6
  process.env.ARC_CLOUDFORMATION = true
  t.ok(process.env.ARC_CLOUDFORMATION, 'In Arc 6 mode')
  usually()

  // Arc 6 + compression
  usually({ contentEncoding: 'gzip' })
  delete process.env.ARC_CLOUDFORMATION
  t.notOk(process.env.ARC_CLOUDFORMATION, 'No longer in Arc 6 mode')

  // Arc Sandbox
  process.env.ARC_HTTP = 'aws_proxy'
  t.ok(process.env.ARC_HTTP, 'In sandbox mode')
  usually()
  delete process.env.ARC_HTTP
  t.notOk(process.env.ARC_HTTP, 'No longer in sandbox mode')

  // Arc 5 HTML
  t.ok(!process.env.ARC_CLOUDFORMATION && !process.env.ARC_HTTP, 'In Arc 5 mode (not a proxy request)')
  let _basicResponse = basicResponse()
  let html = 'text/html'
  _basicResponse.response.headers['Content-Type'] = html
  let result = normalize(_basicResponse)
  t.equal(result.headers['Content-Type'], html, 'Got expected Content-Type header')
  t.ok(result.headers['Cache-Control'], 'Got Cache-Control header')
  t.equal(result.body, fileContents, 'Body matches provided file contents (no encoding)')
  t.equal(result.type, 'text/html', 'Returned response.type param')

  // Arc 5 !HTML
  usually()
})
