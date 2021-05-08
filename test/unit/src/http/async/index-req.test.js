import {dotEnvConfig} from '../../../../deps.ts'
dotEnvConfig({ export: true })

import {
  assert,
  AssertionError,
  assertEquals,
  assertExists
} from "../../../../deps.ts"

import arcHttpSync from '../../../../../src/http/async/index.js'
import arcHttp from '../../../../../src/http/index.js'
import interpolate from '../../../../../src/http/helpers/params.js'
import reqs from '../http-req-fixtures.js'

Deno.env.set('SESSION_TABLE_NAME', 'jwe')

const arcHttpMiddleware = arcHttp.middleware

const str = i => JSON.stringify(i)
const isObject = t => typeof t === 'object' && !!(t)
const unNulled = (before, after) => before === null && isObject(after)
const match = (copy, item) => `${copy} matches: ${item}`
const basicResponse = { statusCode: 200 }

const arc6RestNull = [ 'body', 'pathParameters', 'queryStringParameters', 'multiValueQueryStringParameters' ]
const isNulled = key => arc6RestNull.some(v => v === key)

const arc6RestPrettyParams = {
  method: 'httpMethod',
  params: 'pathParameters',
  query: 'queryStringParameters'
}

function check ({ req, request, deprecated = false }) {
  // Make sure all original keys are present and accounted for
  Object.keys(request).forEach(key => {
    // eslint-disable-next-line
    if (!req.hasOwnProperty(key)) throw new AssertionError(`Original request param missing from interpolated request: ${key}`)
  })
  Object.entries(req).forEach(([ key, val ]) => {
    // Make sure we don't have any false positives matching undefined tests
    if (req[key] === undefined) t.fail(`Parameter is undefined: ${key}`)
    // Compare mutation of nulls into objects
    if (isNulled(key) && request[key] === null) {
      if (unNulled(request[key], val))
        assert(match(`req.${key}`, req[key]))
      else
      throw new AssertionError(`Param not un-nulled: ${key}: ${val}`)
    }
    else {
      assertEquals(str(val), str(req[key]), match(`req.${key}`, str(req[key])))
    }
    // Compare interpolation to nicer, backwards compat req params
    if (arc6RestPrettyParams[key] && !deprecated) {
      assertEquals(str(req[arc6RestPrettyParams[key]]), str(req[key]), `req.${key} == req.${arc6RestPrettyParams[key]}`)
    }
  })
  assert(req.session, 'req.session is present')
}

Deno.test({
  name: 'Set up env', 
  fn: () => {
    //t.plan(3)
    assertExists(arcHttpSync, 'Loaded HTTP async')
    assertExists(arcHttpMiddleware, 'Loaded HTTP middleware alias')
    assertExists(reqs, 'Loaded request fixtures')
    
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): get /', 
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.getIndex
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): get /?whats=up', 
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.getWithQueryString
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): get /?whats=up&whats=there',
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.getWithQueryStringDuplicateKey
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): get /nature/hiking', 
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.getWithParam
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): get /$default', 
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.get$default
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): post /form (JSON)', 
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.postJson
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): post /form (form URL encoded)', 
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.postFormURL
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): post /form (multipart form data)', 
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.postMultiPartFormData
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): post /form (octet stream)', 
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.postOctetStream
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): put /form (JSON)', 
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.putJson
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (HTTP): patch /form (JSON)', 
  fn: async () => {
    //t.plan(22)
    const request = reqs.arc6.http.patchJson
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

/**
 * Arc 6 REST tests for compatibility with Lambda proxy integration signature changes, such as:
 * - `nulls` passed instead of empty objects
 * - All bodies are base64 encoded
 */
Deno.test({
  name: 'Architect v6 (REST): get /', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.getIndex
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): get /?whats=up', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.getWithQueryString
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): get /?whats=up&whats=there', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.getWithQueryStringDuplicateKey
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): get /nature/hiking', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.getWithParam
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): get /{proxy+}', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.getProxyPlus
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): post /form (JSON)', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.postJson
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): post /form (form URL encoded)', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.postFormURL
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): post /form (multipart form data)', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.postMultiPartFormData
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): post /form (octet stream)', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.postOctetStream
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): put /form (JSON)', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.putJson
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): patch /form (JSON)', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.patchJson
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v6 (REST): delete /form (JSON)', 
  fn: async () => {
    //t.plan(18)
    const request =reqs.arc6.rest.deleteJson
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request})
  },
  sanitizeResources: false,
  sanitizeOps: false
})

/**
 * Arc 5 tests against later VTL-based request shapes, which include things not present in < Arc 5, such as:
 * - `httpMethod` & `queryStringParameters` (which duplicate `method` + `query`)
 * - `body: {base64: 'base64encodedstring...'}`
 * Backwards compatibility should not be determined solely by the presense of these additional params
 */
Deno.test({
  name: 'Architect v5 (REST): get /', 
  fn: async () => {
    //t.plan(10)
    const request =reqs.arc5.getIndex
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request, deprecated: true })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST): get /?whats=up', 
  fn: async () => {
    //t.plan(10)
    const request =reqs.arc5.getWithQueryString
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request, deprecated: true })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST): get /nature/hiking', 
  fn: async () => {
    //t.plan(10)
    const request =reqs.arc5.getWithParam
    interpolate(request)
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request, deprecated: true })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST): post /form (JSON / form URL-encoded)', 
  fn: async () => {
    //t.plan(10)
    const request =reqs.arc5.post
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request, deprecated: true })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST): post /form (multipart form data-encoded)', 
  fn: async () => {
    //t.plan(10)
    const request =reqs.arc5.postBinary
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request, deprecated: true })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST): put /form', 
  fn: async () => {
    //t.plan(10)
    const request =reqs.arc5.put
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request, deprecated: true })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST): patch /form', 
  fn: async () => {
    //t.plan(10)
    const request =reqs.arc5.patch
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request, deprecated: true })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Architect v5 (REST): delete /form', 
  fn: async () => {
    //t.plan(10)
    const request =reqs.arc5.delete
    let req
    const fn = async request => {
      req = request
      return basicResponse
    }
    const handler = arcHttpSync(fn)
    await handler(request)
    check({ req, request, deprecated: true })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'arc.middleware should allow the mutation of request object between middleware functions', 
  fn: () => {
    //t.plan(1)
    const request =reqs.arc5.getIndex
    let req = JSON.parse(str(request))
    function one (req) {
      req.body = req.body || {}
      req.body.munge = true
      return req
    }
    function two (req) {
      assert(req.body.munge, 'request object was mutated in middleware')
      return { statusCode: 200, body: req.body }
    }
    const handler = arcHttpSync(one, two)
    handler(req)
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'arc.middleware should pass along original request if function does not return', 
  fn: async () => {
    //t.plan(1)
    const request =reqs.arc5.getIndex
    let gotOne
    async function one (req) {
      gotOne = req
      return
    }
    let gotTwo
    async function two (req) {
      gotTwo = req
      return { statusCode: 200 }
    }
    let req = JSON.parse(str(request))
    const handler = arcHttpSync(one, two)
    await handler(req)
    assertEquals(str(gotOne), str(gotTwo), match('second function request', `${str(gotTwo).substr(0, 50)}...`))
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: "Teardown", 
  fn: () => {
      Deno.env.delete('SESSION_TABLE_NAME')
      assert('Done')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

