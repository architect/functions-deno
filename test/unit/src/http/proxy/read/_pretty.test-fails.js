import {dotEnvConfig} from '../../../../../deps.ts'
dotEnvConfig({ export: true })

import mockfs from '../../../../../deps.ts'  //wont work process.binding not available
import proxyquire from '../../../../../deps.ts'
import { Buffer } from '../../../../../deps.ts'
import { assert, assertEquals } from '../../../../../deps.ts'

let env = Deno.env.get('NODE_ENV')
let pathToStatic = Deno.env.get('ARC_SANDBOX_PATH_TO_STATIC')

let errorState
let buf = msg => Buffer.from(msg)
// Tried to use 'aws-sdk-mock', wasn't able to get it working with aws.whatever().promise()
let S3Stub = { S3: function ctor () {
  return {
    getObject: function ({ Key }) {
      // Good responses (only checking body here)
      // eslint-disable-next-line
      let got = { promise: async function () {
        return { Body: buf(`got ${Key}`) }
      } }

      // Failed requests (aws-sdk completely blows up)
      // eslint-disable-next-line
      let thrower = { promise: async function () {
        let err = new Error(errorState)
        err.name = errorState
        throw err
      } }

      if (isFolder) {
        if (Key.includes('ok/hi')) return got
        if (Key.includes('notOk')) return thrower
      }
      if (Key.includes('404') && !errorState) return got
      return thrower
    }
  }
} }

let reset = () => {
  Key = isFolder = errorState = undefined
  mockfs.restore()
}

let pretty = proxyquire('../../../../../../src/http/proxy/read/_pretty', {
  'aws-sdk': S3Stub
})

let Key
let isFolder
let Bucket = 'a-bucket'
let headers = {}

Deno.test({
  name: 'Set up env', 
  fn: () => {
    //t.plan(1)
    assert(pretty, 'Loaded pretty')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Peek and find nested index.html', 
  fn: async () => {
    //t.plan(4)
    // AWS
    Deno.env.set('NODE_ENV', 'staging')
    Key = 'ok/hi'
    isFolder = true
    let result = await pretty({
      Bucket,
      Key,
      headers,
      isFolder
    })
    assertEquals(result.body, 'got ok/hi/index.html', 'Successfully peeked into an S3 folder without a trailing slash')

    // Fingerprinting enabled
    let assets = {
      'ok/hi/index.html': 'ok/hi/index-abc12.html'
    }
    result = await pretty({
      Bucket,
      Key,
      assets,
      headers,
      isFolder
    })
    assertEquals(result.body, 'got ok/hi/index-abc12.html', 'Successfully peeked into an S3 folder with fingerprinting enabled')

    // Fingerprinting enabled with prefix
    let prefix = 'a-prefix'
    result = await pretty({
      Bucket,
      Key: `${prefix}/${Key}`,
      assets,
      headers,
      isFolder,
      prefix
    })
    assertEquals(result.body, 'got a-prefix/ok/hi/index-abc12.html', 'Successfully peeked into an S3 folder with fingerprinting and prefix enabled')

    // Local
    Deno.env.set('NODE_ENV', 'testing')
    Deno.env.set('ARC_SANDBOX_PATH_TO_STATIC', '')
    let msg = 'got ok/hi/index.html from local!'
    mockfs({
      'ok/hi/index.html': buf(msg)
    })
    result = await pretty({
      Bucket,
      Key,
      headers,
      isFolder
    })
    reset() // Must be reset before any tape tests are resolved because mock-fs#201
    assertEquals(result.body, msg, 'Successfully peeked into a local folder without a trailing slash')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Peek and do not find nested index.html', 
  fn: async () => {
    //t.plan(4)
    // AWS
    Deno.env.set('NODE_ENV', 'staging')
    Key = 'notOk',
    isFolder = true
    errorState = 'NoSuchKey'
    let result = await pretty({
      Bucket,
      Key,
      headers,
      isFolder
    })
    assertEquals(result.statusCode, 404, 'Returns statusCode of 404 if S3 file is not found')
    assert(result.body.includes('NoSuchKey'), 'Error message included in response from S3')

    // Local
    Deno.env.set('NODE_ENV', 'testing')
    result = await pretty({
      Bucket,
      Key,
      headers,
      isFolder
    })
    assertEquals(result.statusCode, 404, 'Returns statusCode of 404 if local file is not found')
    assert(result.body.includes('NoSuchKey'), 'Error message included in response from local')
    reset()
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test('Return a custom 404', async t => {
  //t.plan(8)
  // AWS
  Deno.env.set('NODE_ENV', 'staging')
  Key = 'getCustom404'
  let result = await pretty({
    Bucket,
    Key,
    headers,
    isFolder
  })
  assertEquals(result.statusCode, 404, 'Returns statusCode of 404 with custom 404 error from S3')
  assertEquals(result.body, 'got 404.html', 'Output is custom 404 page from S3 at: 404.html')

  // Fingerprinting enabled
  let assets = {
    '404.html': '404-abc12.html'
  }
  result = await pretty({
    Bucket,
    Key,
    assets,
    headers,
    isFolder
  })
  assertEquals(result.statusCode, 404, 'Returns statusCode of 404 with custom 404 error from S3')
  assertEquals(result.body, 'got 404-abc12.html', 'Output is custom 404 page from S3 at: 404-abc12.html')

  // Fingerprinting enabled with prefix
  let prefix = 'a-prefix'
  result = await pretty({
    Bucket,
    Key: `${prefix}/${Key}`,
    assets,
    headers,
    isFolder,
    prefix
  })
  assertEquals(result.statusCode, 404, 'Returns statusCode of 404 with custom 404 error from S3')
  assertEquals(result.body, 'got a-prefix/404-abc12.html', 'Output is custom 404 page from S3 at: a-prefix/404-abc12.html')

  // Local
  Deno.env.set('NODE_ENV', 'testing')
  // Update mockfs to find a 404
  let msg = 'got 404 from local!'
  mockfs({ '404.html': buf(msg) })
  result = await pretty({
    Bucket,
    Key,
    headers,
    isFolder
  })
  reset() // Must be reset before any tape tests are resolved because mock-fs#201
  assertEquals(result.statusCode, 404, 'Returns statusCode of 404 with custom 404 error from local')
  assertEquals(result.body, msg, 'Output is custom 404 page from local')
})

Deno.test({
  name: 'Return the default 404', 
  fn: async () => {
    //t.plan(4)
    // AWS
    Deno.env.set('NODE_ENV', 'staging')
    Key = 'cantfindme'
    errorState = 'NoSuchKey'
    let result = await pretty({
      Bucket,
      Key,
      headers,
      isFolder
    })
    assertEquals(result.statusCode, 404, 'Returns statusCode of 404 if S3 file is not found')
    assert(result.body.includes('NoSuchKey'), 'Error message included in response from S3')

    // Local
    Deno.env.set('NODE_ENV', 'staging')
    // Update mockfs to find a nothing
    mockfs({})
    Key = 'cantfindme'
    errorState = 'NoSuchKey'
    result = await pretty({
      Bucket,
      Key,
      headers,
      isFolder
    })
    reset() // Must be reset before any tape tests are resolved because mock-fs#201
    assertEquals(result.statusCode, 404, 'Returns statusCode of 404 if local file is not found')
    assert(result.body.includes('NoSuchKey'), 'Error message included in response from local')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Teardown', 
  fn: () => {
    Deno.env.set('NODE_ENV', env)
    if (pathToStatic === 'undefined') {
      Deno.env.delete('ARC_SANDBOX_PATH_TO_STATIC')
    }
    else Deno.env.set('ARC_SANDBOX_PATH_TO_STATIC', pathToStatic)
    assert('Ok')
  },
  sanitizeResources: false,
  sanitizeOps: false
})
