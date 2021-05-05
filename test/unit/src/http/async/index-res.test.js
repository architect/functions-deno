import arcHttpSync from '../../../../../src/http/async/index.js'
import arcHttp from '../../../../../src/http/index.js'
const arcHttpMiddleware = arcHttp.middleware
import requests from '../http-req-fixtures.js'
import responses from '../http-res-fixtures.js'

import { sinon } from '../../../../deps.ts'
import { Buffer } from '../../../../deps.ts'
import {
    assert,
    AssertionError,
    assertEquals,
    assertExists,
    assertNotEquals
  } from '../../../../deps.ts'

const b64dec = i => Buffer.from(i, 'base64').toString()
const str = i => JSON.stringify(i)
const match = (copy, item) => `${copy} matches: ${item}`

// TODO write error tests

// Deal with Arc 6 specific env vars
const arc6EnvVars = {
  setup: function () {
    Deno.env.set('ARC_CLOUDFORMATION', 'true')
    Deno.env.set('ARC_HTTP', 'aws_proxy')
    
    if (Deno.env.get('ARC_CLOUDFORMATION') !== 'true' ||
        Deno.env.get('ARC_HTTP') !== 'aws_proxy')
    throw new AssertionError('Did not populate ARC_CLOUDFORMATION or ARC_HTTP')
  },
  teardown: function () {
    Deno.env.delete('ARC_CLOUDFORMATION')
    Deno.env.delete('ARC_HTTP')

    if (Deno.env.get('ARC_CLOUDFORMATION') || Deno.env.get('ARC_HTTP'))
      throw new AssertionError('Did not clean ARC_CLOUDFORMATION or ARC_HTTP')
  }
}

const run = async (response, request) => {
  const fn = () => response
  const handler = arcHttpSync(fn)
  return handler(request)
}

Deno.test({
    name: 'Set up env', 
    fn: () => {
        //t.plan(4)
        assertExists(arcHttpSync, 'Loaded HTTP async')
        assertExists(arcHttpMiddleware, 'Loaded HTTP middleware alias')
        assertExists(requests, 'Loaded request fixtures')
        assertExists(responses, 'Loaded response fixtures')
        // Init env var to keep from stalling on db reads in CI
        Deno.env.set('SESSION_TABLE_NAME', 'jwe')
    },
    sanitizeResources: false,
    sanitizeOps: false
})

Deno.test({
    name: 'Architect v6 (HTTP)', 
    fn: async () => {
    //t.plan(48)
    const request = requests.arc6.http.getIndex
    arc6EnvVars.setup()

    let res = await run(responses.arc6.http.noReturn, request)
    assertEquals(res.body, '', 'Empty body passed')
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.emptyReturn, request)
    assertEquals(res.body, '', 'Empty body passed')
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.string, request)
    assertEquals(str(responses.arc6.http.string), res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.object, request)
    assertEquals(str(responses.arc6.http.object), res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.array, request)
    assertEquals(str(responses.arc6.http.array), res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.buffer, request)
    assertEquals(str(responses.arc6.http.buffer), res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.number, request)
    assertEquals(str(responses.arc6.http.number), res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.bodyOnly, request)
    assertEquals(responses.arc6.http.bodyOnly.body, res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.bodyWithStatus, request)
    assertEquals(responses.arc6.http.bodyWithStatus.body, res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.bodyWithStatusAndContentType, request)
    assertEquals(responses.arc6.http.bodyWithStatusAndContentType.body, res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.encodedWithBinaryType, request)
    assertEquals(responses.arc6.http.encodedWithBinaryType.body, res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/pdf'), 'Unspecified content type defaults to JSON')
    assert(res.isBase64Encoded, 'isBase64Encoded param passed through')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.cookies, request)
    assertEquals(responses.arc6.http.cookies.body, res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(str(responses.arc6.http.cookies.cookies), str(res.cookies), match('res.cookies', res.cookies))
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.secureCookies, request)
    assertEquals(responses.arc6.http.secureCookies.body, res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(str(responses.arc6.http.secureCookies.cookies), str(res.cookies), match('res.cookies', res.cookies))
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.secureCookieHeader, request)
    assertEquals(responses.arc6.http.secureCookieHeader.body, res.body, match('res.body', res.body))
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(responses.arc6.rest.secureCookieHeader.headers['set-cookie'], res.headers['set-cookie'], match(`res.headers['set-cookie']`, res.headers['set-cookie']))
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.http.invalid, request)
    assertEquals(res.body, '', 'Empty body passed')
    assertEquals(responses.arc6.http.invalid.statusCode, res.statusCode, 'Responded with invalid status code')

    arc6EnvVars.teardown()
  },
  sanitizeResources: false,
  sanitizeOps: false
})


Deno.test({
  name: 'Architect v6 (REST): dependency-free responses', 
  fn: async () => {
    //t.plan(39)
    const request = requests.arc6.rest.getIndex
    arc6EnvVars.setup()

    let res = await run(responses.arc6.rest.body, request)
    assertEquals(responses.arc6.rest.body.body, res.body, match('res.body', res.body))
    assertNotEquals(res.isBase64Encoded, true, 'isBase64Encoded param not passed through')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.rest.isBase64Encoded, request)
    assertEquals(responses.arc6.rest.isBase64Encoded.body, res.body, match('res.body', res.body))
    assert(res.isBase64Encoded, 'isBase64Encoded param passed through')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.rest.buffer, request)
    assert(typeof res.body === 'string', 'Received string (and not buffer) back')
    assertEquals(b64dec(res.body), 'hi there\n', 'Body properly auto-encoded')
    assert(res.isBase64Encoded, 'isBase64Encoded param set automatically')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.rest.encodedWithBinaryTypeBad, request)
    assert(typeof res.body === 'string', 'Body is (likely) base 64 encoded')
    assertEquals(b64dec(res.body), 'hi there\n', 'Body properly auto-encoded')
    assert(res.isBase64Encoded, 'isBase64Encoded param set automatically')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.rest.encodedWithBinaryTypeGood, request)
    assert(typeof res.body === 'string', 'Body is (likely) base 64 encoded')
    assertEquals(b64dec(res.body), 'hi there\n', 'Body properly auto-encoded')
    assert(res.isBase64Encoded, 'isBase64Encoded param set automatically')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.rest.encodedWithBinaryTypeGood, request)
    assert(typeof res.body === 'string', 'Body is (likely) base 64 encoded')
    assertEquals(b64dec(res.body), 'hi there\n', 'Body properly auto-encoded')
    assert(res.isBase64Encoded, 'isBase64Encoded param passed through')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.rest.secureCookieHeader, request)
    assertEquals(responses.arc6.rest.secureCookieHeader.body, res.body, match('res.body', res.body))
    assertNotEquals(res.isBase64Encoded, true, 'isBase64Encoded param not passed through')
    assertEquals(responses.arc6.rest.secureCookieHeader.headers['set-cookie'], res.headers['set-cookie'], match(`res.headers['set-cookie']`, res.headers['set-cookie']))
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.rest.secureCookieMultiValueHeader, request)
    assertEquals(responses.arc6.rest.secureCookieMultiValueHeader.body, res.body, match('res.body', res.body))
    assertNotEquals(res.isBase64Encoded, true, 'isBase64Encoded param not passed through')
    assertEquals(str(responses.arc6.rest.secureCookieMultiValueHeader.multiValueHeaders), str(res.multiValueHeaders), match(`res.multiValueHeaders`, str(res.multiValueHeaders)))
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.rest.multiValueHeaders, request)
    assertEquals(res.body, '', 'Empty body passed')
    assertNotEquals(res.isBase64Encoded, true, 'isBase64Encoded param not passed through')
    // Headers object gets mutated, so let's just ensure a header we set is there
    assertEquals(str(responses.arc6.rest.multiValueHeaders.headers['Set-Cookie']), str(res.headers['Set-Cookie']), match(`res.headers['Set-Cookie']`, str(res.headers['Set-Cookie'])))
    assertEquals(str(responses.arc6.rest.multiValueHeaders.multiValueHeaders), str(res.multiValueHeaders), match(`res.multiValueHeaders`, str(res.multiValueHeaders)))
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc6.rest.invalidMultiValueHeaders, request)
    assertEquals(res.body, '', 'Empty body passed')
    assertNotEquals(res.isBase64Encoded, true, 'isBase64Encoded param not passed through')
    // Headers object gets mutated, so let's just ensure a header we set is there
    assertEquals(str(responses.arc6.rest.invalidMultiValueHeaders.invalidMultiValueHeaders), str(res.invalidMultiValueHeaders), match(`res.invalidMultiValueHeaders`, str(res.invalidMultiValueHeaders)))
    assertEquals(res.statusCode, 200, 'Responded with 200')

    arc6EnvVars.teardown()
  },
  sanitizeResources: false,
  sanitizeOps: false
})


Deno.test({
  name: 'Architect v5 (REST): dependency-free responses', 
  fn: async () => {
    //t.plan(21)
    let request = requests.arc5.getIndex

    let res = await run(responses.arc5.type, request)
    assertEquals(responses.arc5.type.type, res.headers['Content-Type'], `type matches res.headers['Content-Type']: ${res.headers['Content-Type']}`)
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.cookie, request)
    assertEquals(res.headers['Set-Cookie'], responses.arc5.cookie.cookie, `Cookie set: ${responses.arc5.cookie.cookie}...`)
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.secureCookie, request)
    assertEquals(res.headers['Set-Cookie'], responses.arc5.secureCookie.cookie, `Cookie set: ${responses.arc5.secureCookie.cookie}...`)
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.secureCookieHeader, request)
    assertEquals(responses.arc5.secureCookieHeader.headers['set-cookie'], res.headers['set-cookie'], match(`res.headers['set-cookie']`, res.headers['set-cookie']))
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.cors, request)
    assertEquals(res.headers['Access-Control-Allow-Origin'], '*', `CORS boolean set res.headers['Access-Control-Allow-Origin'] === '*'`)
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.isBase64Encoded, request)
    assertEquals(responses.arc5.isBase64Encoded.body, res.body, match('res.body', res.body))
    assert(res.isBase64Encoded, 'isBase64Encoded param passed through')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.isBase64EncodedType, request)
    assertEquals(responses.arc5.isBase64EncodedType.body, res.body, match('res.body', res.body))
    assertEquals(responses.arc5.isBase64EncodedType.type, res.headers['Content-Type'], `type matches res.headers['Content-Type']: ${res.headers['Content-Type']}`)
    assert(res.isBase64Encoded, 'isBase64Encoded param passed through')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.isBase64EncodedUnknownCT, request)
    assertEquals(responses.arc5.isBase64EncodedUnknownCT.body, res.body, match('res.body', res.body))
    assertEquals(responses.arc5.isBase64EncodedUnknownCT.headers['content-type'], res.headers['Content-Type'], match(`res.headers['content-type']`, res.headers['Content-Type']))
    assert(res.isBase64Encoded, 'isBase64Encoded param passed through')
    assertEquals(res.statusCode, 200, 'Responded with 200')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST) + Functions', 
  fn: async () => {
    // Arc 5 `arc.http()` functionality backported to `arc.http.arcHttpSync()`
    //t.plan(15)
    let request = requests.arc5.getIndex

    let antiCache = 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
    let res = await run(responses.arc5.body, request)
    assertEquals(str(responses.arc5.body.body), str(res.body), match('res.body', res.body))
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.cacheControl, request)
    assertEquals(responses.arc5.cacheControl.cacheControl, res.headers['Cache-Control'], match(`res.headers['Cache-Control']`, str(res.headers['Cache-Control'])))
    if (responses.arc5.cacheControl.headers['cache-control'] && !res.headers['cache-control'])
      assert(true, `Headers normalized and de-duped: ${str(res.headers)}`)
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.noCacheControlHTML, request)
    assertEquals(res.headers['Cache-Control'], antiCache, 'Default anti-caching headers set for HTML response')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.noCacheControlJSON, request)
    assertEquals(res.headers['Cache-Control'], antiCache, 'Default anti-caching headers set for JSON response')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.noCacheControlJSONapi, request)
    assertEquals(res.headers['Cache-Control'], antiCache, 'Default anti-caching headers set for JSON response')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.noCacheControlOther, request)
    let def = 'max-age=86400'
    assertEquals(res.headers['Cache-Control'], def, 'Default caching headers set for non-HTML/JSON response')
    assertEquals(res.statusCode, 200, 'Responded with 200')

    res = await run(responses.arc5.defaultsToJson, request)
    assert(res.headers['Content-Type'].includes('application/json'), 'Unspecified content type defaults to JSON')
    assertEquals(res.statusCode, 200, 'Responded with 200')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST) + Functions + /{proxy+}', 
  fn: async () => {
    //t.plan(3)
    let request = requests.arc6.rest.getProxyPlus
    arc6EnvVars.setup()

    let res = await run(responses.arc6.rest.body, request)
    assertEquals(responses.arc6.rest.body.body, res.body, match('res.body', res.body))
    assertNotEquals(res.isBase64Encoded, true, 'isBase64Encoded param not passed through')
    assertEquals(res.statusCode, 200, 'Responded with 200')
    arc6EnvVars.teardown()
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST) + Functions + ARC_HTTP = aws', 
  fn: async () => {
    //t.plan(4)
    let request = requests.arc5.getIndex
    Deno.env.set('ARC_HTTP', 'aws')
    assertEquals(Deno.env.get('ARC_HTTP'), 'aws', 'Set: ARC_HTTP = aws')

    let res = await run(responses.arc5.body, request)
    assertEquals(str(responses.arc5.body.body), str(res.body), match('res.body', res.body))
    assertEquals(res.statusCode, 200, 'Responded with 200')
    assert(res.type, 'Responded with res.type set with ARC_HTTP = aws')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST) + Functions + ARC_HTTP = aws_proxy', 
  fn: async () => {
    //t.plan(4)
    let request = requests.arc5.getIndex
    Deno.env.set('ARC_HTTP', 'aws_proxy')
    assertEquals(Deno.env.get('ARC_HTTP'), 'aws_proxy', 'Set: ARC_HTTP = aws_proxy')

    let res = await run(responses.arc5.body, request)
    assertEquals(str(responses.arc5.body.body), str(res.body), match('res.body', res.body))
    assertEquals(res.statusCode, 200, 'Responded with 200')
    assertNotEquals(res.type, true, 'Responded without res.type set with ARC_HTTP = aws_proxy')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST) + Functions + ARC_HTTP = other', 
  fn: async () => {
    //t.plan(4)
    let request = requests.arc5.getIndex
    Deno.env.set('ARC_HTTP', 'other')
    assertEquals(Deno.env.get('ARC_HTTP'), 'other', 'Set: ARC_HTTP = other')

    let res = await run(responses.arc5.body, request)
    assertEquals(str(responses.arc5.body.body), str(res.body), match('res.body', res.body))
    assertEquals(res.statusCode, 200, 'Responded with 200')
    assertNotEquals(res.type, true, 'Responded without res.type set with ARC_HTTP = other')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST) + Functions + !ARC_HTTP + !ARC_CLOUDFORMATION', 
  fn: async () => {
    //t.plan(5)
    let request = requests.arc5.getIndex
    Deno.env.delete('ARC_HTTP')
    assertNotEquals(Deno.env.get('ARC_HTTP'), true, 'ARC_HTTP not set')
    assertNotEquals(Deno.env.get('ARC_CLOUDFORMATION'), true, 'ARC_CLOUDFORMATION not set')

    let res = await run(responses.arc5.body, request)
    assertEquals(str(responses.arc5.body.body), str(res.body), match('res.body', res.body))
    assertEquals(res.statusCode, 200, 'Responded with 200')
    assert(res.type, 'Responded with res.type set (default behavior)')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST) + Functions + ARC_CLOUDFORMATION = true', 
  fn: async () => {
    //t.plan(5)
    let request = requests.arc5.getIndex
    Deno.env.set('ARC_CLOUDFORMATION', 'true')
    assert(Deno.env.get('ARC_CLOUDFORMATION'), 'Set: ARC_CLOUDFORMATION = true')

    let res = await run(responses.arc5.body, request)
    assertEquals(str(responses.arc5.body.body), str(res.body), match('res.body', res.body))
    assertEquals(res.statusCode, 200, 'Responded with 200')
    assertNotEquals(res.type, true, 'Responded without res.type set with ARC_CLOUDFORMATION = true')
    Deno.env.delete('ARC_CLOUDFORMATION')
    assertNotEquals(Deno.env.get('ARC_CLOUDFORMATION'), 'Unset: ARC_CLOUDFORMATION = true')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

// Do not test Architect v4 + Functions statically-bound content type responses; arc.middleware introduced in Arc 5

Deno.test({
  name: 'Architect <6 response params', 
  fn: async () => {
    //t.plan(5)
    let request = requests.arc5.getIndex

    let res = await run(responses.arc.location, request)
    assertEquals(responses.arc.location.location, res.headers.Location, match('location', res.headers.Location))

    res = await run(responses.arc.status, request)
    assertEquals(responses.arc.status.status, res.statusCode, match('status', res.statusCode))

    res = await run(responses.arc.code, request)
    assertEquals(responses.arc.code.code, res.statusCode, match('status', res.statusCode))

    res = await run(responses.arc.statusCode, request)
    assertEquals(responses.arc.statusCode.statusCode, res.statusCode, match('status', res.statusCode))

    res = await run(responses.arc.session, request)
    assert(res.headers['Set-Cookie'].includes('_idx='), `Cookie set: ${res.headers['Set-Cookie'].substr(0, 75)}...`)
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Should prevent further middleware from running when a response is returned', 
  fn: () => {
    //t.plan(1)
    let request = requests.arc5.getIndex
    function one () { return { statusCode: 200 } }
    let two = sinon.fake()
    let handler = arcHttpSync(one, two)
    handler(request)
    assertNotEquals(two.callCount, true, 'second middleware not called')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Should throw if no middleware returns a response', 
  fn: async () => {
    //t.plan(1)
    let request = requests.arc5.getIndex
    function one (req) { return req }
    function two (req) { return req }
    let handler = arcHttpSync(one, two)
    try {
      await handler(request)
    }
    catch (e) {
      assert(e, 'exception thrown')
    }
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Teardown', 
  fn: () => {
    //t.plan(1)
    // Unset env var for future testing (ostensibly)
    Deno.env.delete('SESSION_TABLE_NAME')
    assert('Done')
  },
  sanitizeResources: false,
  sanitizeOps: false
})
