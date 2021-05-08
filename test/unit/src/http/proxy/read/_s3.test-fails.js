import {dotEnvConfig} from '../../../../../deps.ts'
dotEnvConfig({ export: true })

import proxyquire from '../../../../../deps.ts'
import { gzipEncode } from '../../../../../deps.ts'
import { Buffer } from '../../../../../deps.ts'
import { assert, assertEquals,assertNotEquals } from '../../../../../deps.ts'
/**
 * We'll test for basic response formatting, templatization, and headers
 *
 * Note: at first glance, it seems like there should be more to test in this method
 * However, deeper testing for content-type, cache-control, etc. are found in other tests, so this should cover pretty much every critical path
 */

// Stubs
// eslint-disable-next-line
let prettyStub = async () => 'pretty'
// S3
let enable304
let errorState
let options = {}
let S3Stub = {
  S3: function ctor () {
    return {
      getObject: function (opts) {
        options = opts
        if (enable304) return {
          // eslint-disable-next-line
          promise: async function () {
            let err = new Error('this will be a 304')
            err.code = 'NotModified'
            throw err
          }
        }
        else if (errorState) return {
          // eslint-disable-next-line
          promise: async function () {
            let err = new Error(errorState)
            err.name = errorState
            throw err
          }
        }
        else return {
          // eslint-disable-next-line
          promise: async function () {
            return response
          }
        }
      }
    }
  },
  '@noCallThru': true
}
let staticStub = {
  'images/this-is-fine.gif': 'images/this-is-fine-a1c3e5.gif',
  'images/hold-onto-your-butts.gif': 'images/hold-onto-your-butts-b2d4f6.gif',
  'app.js': 'app-a1c3e5.js',
  'index.html': 'index-b2d4f6.html',
}

// Generates proxy read requests
function read (params = {}) {
  let { Bucket, Key, IfNoneMatch, isProxy, config, rootPath } = params
  return {
    Bucket: Bucket || defaultBucket,
    Key: Key || imgName,
    IfNoneMatch: IfNoneMatch || imgETag,
    isProxy: isProxy || true,
    config: config || { spa: true },
    rootPath: rootPath || undefined
  }
}

// Generates proxy read responses for comparison
let response
function createResponse (ct, fc, args) {
  response = {
    ContentType: ct || imgContentType,
    ETag: imgETag,
    Body: Buffer.from(fc || imgContents),
  }
  if (args) Object.assign(response, args)
}

// Some utilities
let dec = i => Buffer.from(i, 'base64').toString()
let b64 = buf => Buffer.from(buf).toString('base64')

function setup () {
  // Make sure options are good!
  options = {}
  createResponse()
}

// File contents & defaults
let defaultBucket = 'a-bucket'
let imgName = 'images/this-is-fine.gif'
let imgContents = Buffer.from('Just imagine some image contents here')
let imgContentType = 'image/gif'
let defaultCacheControl = 'public, max-age=0, must-revalidate'
let imgETag = 'abc123'

// Ok, we're good to go
let readS3 = proxyquire('../../../../../../src/http/proxy/read/_s3', {
  'aws-sdk': S3Stub,
  './_pretty': prettyStub
})

Deno.test({
  name: 'Set up env', 
  fn: () => {
      //t.plan(1)
      assert(readS3, 'Loaded readS3')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'S3 proxy reader returns formatted response (200)', 
  fn: async () => {
    setup()
    //t.plan(6)

    let result = await readS3(read())
    assertEquals(result.statusCode, 200, 'Returns statusCode: 200')
    assertEquals(result.headers['Cache-Control'], defaultCacheControl, 'Returns correct cache-control')
    assertEquals(result.headers['Content-Type'], imgContentType, 'Returns correct content-type')
    assertEquals(result.headers['ETag'], imgETag, 'Returns correct ETag')
    assertEquals(result.body, b64(imgContents), 'Returns correct body')
    assert(result.isBase64Encoded, 'Returns isBase64Encoded: true')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'S3 proxy reader respects prefix (folder) lookups', 
  fn: async () => {
    //t.plan(5)
    let prefix = 'file-folder'
    let config = { bucket: { folder: 'rando' } }

    // Test ARC_STATIC_PREFIX
    Deno.env.set('ARC_STATIC_PREFIX', prefix)
    setup()
    await readS3(read())
    assertEquals(options.Key, `${prefix}/${imgName}`, `ARC_STATIC_PREFIX sets folder: ${options.Key}`)

    // Test ARC_STATIC_PREFIX vs config
    setup()
    await readS3(read({ config }))
    assertEquals(options.Key, `${prefix}/${imgName}`, `ARC_STATIC_PREFIX overrides folder config: ${options.Key}`)
    Deno.env.delete('ARC_STATIC_PREFIX')

    // Test ARC_STATIC_FOLDER
    Deno.env.set('ARC_STATIC_FOLDER', prefix)
    setup()
    await readS3(read())
    assertEquals(options.Key, `${prefix}/${imgName}`, `ARC_STATIC_FOLDER sets folder: ${options.Key}`)

    // Test ARC_STATIC_FOLDER vs config
    setup()
    await readS3(read({ config }))
    assertEquals(options.Key, `${prefix}/${imgName}`, `ARC_STATIC_FOLDER overrides folder config: ${options.Key}`)
    Deno.env.delete('ARC_STATIC_FOLDER')

    // Test folder config
    setup()
    await readS3(read({ config }))
    assertEquals(options.Key, `${config.bucket.folder}/${imgName}`, `config.bucket.folder sets folder: ${options.Key}`)
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'S3 proxy reader returns 304 (aka S3 NotModified)', 
  fn: async () => {
    setup()
    //t.plan(2)

    enable304 = true
    let result = await readS3(read())
    assertEquals(result.statusCode, 304, 'Returns statusCode of 304 if ETag matches')
    assertEquals(result.headers['ETag'], imgETag, 'Etag matches request')
    enable304 = false
  }
})

Deno.test({
  name: 'S3 proxy reader passes through ContentEncoding to response headers', 
  fn: async () => {
    // ContentEncoding is metadata published on upload; since it's S3-specific, we don't have an equivalent local test yet
    setup()
    //t.plan(7)

    let ContentEncoding = 'gzip'
    let Body = gzipEncode(Buffer.from(imgContents))
    createResponse(null, null, {
      ContentEncoding,
      Body
    })
    let result = await readS3(read())
    assertEquals(result.statusCode, 200, 'Returns statusCode: 200')
    assertEquals(result.headers['Cache-Control'], defaultCacheControl, 'Returns correct cache-control')
    assertEquals(result.headers['Content-Type'], imgContentType, 'Returns correct content-type')
    assertEquals(result.headers['Content-Encoding'], ContentEncoding, 'Returns correct content-encoding')
    assertEquals(result.headers['ETag'], imgETag, 'Returns correct ETag')
    assertEquals(result.body, b64(Body), 'Returns correct body')
    assert(result.isBase64Encoded, 'Result is base64 encoded')
  }
})

/**
 * These fingerprint tests are AWS-specific: we don't do fingerprint lookups locally
 */
Deno.test({
  name: 'Fingerprint: fall back to non-fingerprinted file when requested file is not found in static manifest', 
  fn: async () => {
    setup()
    //t.plan(2)

    await readS3(read())
    assertEquals(options.Bucket, defaultBucket, `Used normal bucket: ${options.Bucket}`)
    assertEquals(options.Key, imgName, `Fall back to non-fingerprinted filename: ${options.Key}`)
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Fingerprint: filename is passed through & not interpolated for non-captured requests', 
  fn: async () => {
    setup()
    t.plan(2)

    let Bucket = 'a-fingerprinted-bucket'
    let Key = 'images/this-is-fine-a1c3e5.gif'
    await readS3(read({ Bucket, Key }))
    assertEquals(options.Bucket, Bucket, `Used alternate bucket: ${options.Bucket}`)
    assertEquals(options.Key, Key, `Read fingerprinted filename: ${options.Key}`)
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Fingerprint: filename is interpolated for captured requests (html, json, etc.)', 
  fn: async () => {
    setup()
    //t.plan(3)

    createResponse('text/html')
    let Bucket = 'a-fingerprinted-bucket'
    let Key = 'index.html'
    let result = await readS3(read({ Bucket, Key, config: { assets: staticStub } }))
    assertEquals(options.Bucket, Bucket, `Used alternate bucket: ${options.Bucket}`)
    assertEquals(options.Key, staticStub[Key], `Read fingerprinted filename: ${options.Key}`)
    assertEquals(result.body, b64(imgContents), `Original contents not mutated: ${result.body}`)
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Fingerprint: valid non-captured request is upgraded to fingerprinted filename', 
  fn: async () => {
    setup()
    //t.plan(9)
    let antiCache = 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'

    createResponse('text/html')
    let Bucket = 'a-fingerprinted-bucket'
    let Key = 'images/this-is-fine.gif'
    let result = await readS3(read({ Bucket, Key, config: { assets: staticStub } }))
    assertEquals(result.statusCode, 302, 'Request forwarded (302)')
    assertEquals(result.headers.location, `/_static/${staticStub[Key]}`, `Forwarded to fingerprinted file: /_static/${staticStub[Key]}`)
    assertEquals(result.headers['Cache-Control'], antiCache, 'Default anti-caching headers set')

    let rootPath = 'staging'
    result = await readS3(read({ Bucket, Key, config: { assets: staticStub }, rootPath }))
    assertEquals(result.statusCode, 302, 'Request forwarded (302)')
    assertEquals(result.headers.location, `/${rootPath}/_static/${staticStub[Key]}`, `Forwarded to fingerprinted file with root path: /${rootPath}/_static/${staticStub[Key]}`)
    assertEquals(result.headers['Cache-Control'], antiCache, 'Default anti-caching headers set')

    rootPath = 'production'
    result = await readS3(read({ Bucket, Key, config: { assets: staticStub }, rootPath }))
    assertEquals(result.statusCode, 302, 'Request forwarded (302)')
    assertEquals(result.headers.location, `/${rootPath}/_static/${staticStub[Key]}`, `Forwarded to fingerprinted file with root path: /${rootPath}/_static/${staticStub[Key]}`)
    assertEquals(result.headers['Cache-Control'], antiCache, 'Default anti-caching headers set')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Fingerprint: template calls are replaced inline on non-captured requests', 
  fn: async () => {
    setup()
    //t.plan(5)

    let fileContents = 'this is just some file contents with an image <img src=${STATIC(\'images/this-is-fine.gif\')}>\n and another image <img src=${arc.static(\'images/hold-onto-your-butts.gif\')}> among other things \n'
    createResponse('text/javascript', fileContents)
    let Bucket = 'a-fingerprinted-bucket'
    let Key = 'app-a1c3e5.js'

    let result = await readS3(read({ Bucket, Key, config: { assets: staticStub } }))
    assertEquals(options.Bucket, Bucket, `Used alternate bucket: ${options.Bucket}`)
    assertEquals(options.Key, Key, `Read fingerprinted filename: ${options.Key}`)
    assertNotEquals(fileContents, dec(result.body), `Contents containing template calls mutated: ${dec(result.body)}`)
    assert(dec(result.body).includes(staticStub['images/this-is-fine.gif']), `Contents now include fingerprinted asset: ${staticStub['images/this-is-fine.gif']}`)
    assert(dec(result.body).includes(staticStub['images/hold-onto-your-butts.gif']), `Contents now include fingerprinted asset: ${staticStub['images/hold-onto-your-butts.gif']}`)
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Fingerprint: template calls are replaced inline on captured requests', 
  fn: async () => {
    setup()
    //t.plan(5)

    let fileContents = 'this is just some file contents with an image <img src=${STATIC(\'images/this-is-fine.gif\')}>\n and another image <img src=${arc.static(\'images/hold-onto-your-butts.gif\')}> among other things \n'
    createResponse('text/html', fileContents)
    let Bucket = 'a-fingerprinted-bucket'
    let Key = 'index.html'

    let result = await readS3(read({ Bucket, Key, config: { assets: staticStub } }))
    assertEquals(options.Bucket, Bucket, `Used alternate bucket: ${options.Bucket}`)
    assertEquals(options.Key, staticStub[Key], `Read fingerprinted filename: ${options.Key}`)
    assertNotEquals(fileContents, result.body, `Contents containing template calls mutated: ${result.body}`)
    assert(dec(result.body).includes(staticStub['images/this-is-fine.gif']), `Contents now include fingerprinted asset: ${staticStub['images/this-is-fine.gif']}`)
    assert(dec(result.body).includes(staticStub['images/hold-onto-your-butts.gif']), `Contents now include fingerprinted asset: ${staticStub['images/hold-onto-your-butts.gif']}`)
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'S3 proxy reader hands off to pretty URLifier on 404', 
  fn: async () => {
    setup()
    //t.plan(1)
    errorState = 'NoSuchKey'
    let result = await readS3(read())
    assertEquals(result, 'pretty', 'File not found returns response from pretty')
    errorState = false
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'S3 proxy reader returns 500 error on S3 error', 
  fn: async () => {
    setup()
    //t.plan(2)
    errorState = 'this is a random error state'
    let result = await readS3(read())
    assertEquals(result.statusCode, 500, 'Returns statusCode of 500 if S3 errors')
    assert(result.body.includes(errorState), 'Error message included in response')
    errorState = false
  },
  sanitizeResources: false,
  sanitizeOps: false
})
