import { httpError } from './errors/index.js'
import binaryTypes from './helpers/binary-types.js'
import { Buffer } from 'https://deno.land/std@0.93.0/node/buffer.ts'

const env = Deno.env.toObject()

export default function responseFormatter (req, params) {
  // Handle HTTP API v2.0 payload scenarios, which have some very strange edges
  if (req.version && req.version === '2.0') {
    // New school AWS
    let knownParams = [ 'statusCode', 'body', 'headers', 'isBase64Encoded', 'cookies' ]
    let hasKnownParams = p => knownParams.some(k => k === p)
    // Old school Arc
    let tidyParams = [ 'code', 'cookie', 'cors', 'location', 'session', 'status' ]
    let hasTidyParams = p => tidyParams.some(k => k === p)
    // Older school Arc
    let staticallyBound = [ 'html', 'css', 'js', 'text', 'json', 'xml' ]
    let isStaticallyBound = p => staticallyBound.some(k => k === p)

    let is = t => typeof params === t
    // Handle scenarios where we have a known parameter returned
    if (is('object') &&
        (params !== null) &&
        !Array.isArray(params) &&
        Object.keys.length === 1 &&
        (Object.keys(params).some(hasKnownParams) ||
         Object.keys(params).some(hasTidyParams) ||
         Object.keys(params).some(isStaticallyBound))) {
      params // noop
    }
    // Handle scenarios where arbitrary stuff is returned to be JSONified
    else if (is('number') ||
             (is('object') && params !== null) ||
             (is('string') && params) ||
             Array.isArray(params) ||
             params instanceof Buffer ) {
      params = { body: JSON.stringify(params) }
    }
    // Not returning is actually valid now lolnothingmatters
    else if (!params) params = {}
  }

  let isError = params instanceof Error // Doesn't really pertain to async
  let buffer
  let bodyIsBuffer = params.body && params.body instanceof Buffer
  if (bodyIsBuffer) buffer = params.body // Back up buffer
  if (!isError) params = JSON.parse(JSON.stringify(params)) // Deep copy to aid testing mutation
  if (bodyIsBuffer) params.body = buffer // Restore non-JSON-encoded buffer

  /**
   * Response defaults
   *   where possible, normalize headers to pascal-kebab case (lolsigh)
   */
  // Body
  let body = params.body || ''

  // Headers: Cache-Control
  let cacheControl = params.cacheControl ||
                     params.headers && params.headers['Cache-Control'] ||
                     params.headers && params.headers['cache-control'] || ''
  if (params.headers && params.headers['cache-control']) {
    delete params.headers['cache-control'] // Clean up improper casing
  }

  // Headers: Content-Type
  let type = params.type ||
             params.headers && params.headers['Content-Type'] ||
             params.headers && params.headers['content-type'] ||
             'application/json; charset=utf8'
  if (params.headers && params.headers['content-type']) {
    delete params.headers['content-type'] // Clean up improper casing
  }

  // Cross-origin ritual sacrifice
  let cors = params.cors

  if (params.html) {
    type = 'text/html; charset=utf8'
    body = params.html
  }
  else if (params.css) {
    type = 'text/css; charset=utf8'
    body = params.css
  }
  else if (params.js) {
    type = 'text/javascript; charset=utf8'
    body = params.js
  }
  else if (params.text) {
    type = 'text/plain; charset=utf8'
    body = params.text
  }
  else if (params.json) {
    type = 'application/json; charset=utf8'
    body = JSON.stringify(params.json)
  }
  else if (params.xml) {
    type = 'application/xml; charset=utf8'
    body = params.xml
  }

  // Status
  let providedStatus = params.status || params.code || params.statusCode
  let statusCode = providedStatus || 200

  let res = {
    headers: Object.assign({}, { 'Content-Type': type }, params.headers || {}),
    statusCode,
    body
  }

  // REST API stuff
  if (params.multiValueHeaders) {
    res.multiValueHeaders = params.multiValueHeaders
  }
  // HTTP API stuff
  if (params.cookies) {
    res.cookies = params.cookies
  }

  // Error override
  if (isError) {
    let statusCode = providedStatus || 500
    let title = params.name
    let message = `
      ${params.message}<br>
      <pre>${params.stack}<pre>
    `
    res = httpError({ statusCode, title, message })
  }

  /**
   * Only send res.type for non-proxy responses in Arc 5; attributes of each env:
   * Arc 6:
   * - ARC_CLOUDFORMATION
   * - ARC_HTTP === 'aws_proxy'
   * Arc 5:
   * - !ARC_CLOUDFORMATION
   * - !ARC_HTTP || ARC_HTTP === 'aws'
   */
  let notArcSix = !env.ARC_CLOUDFORMATION
  let notArcProxy = !env.ARC_HTTP || env.ARC_HTTP === 'aws'
  let isArcFive = notArcSix && notArcProxy
  let notProxyReq = !req.resource || req.resource && req.resource !== '/{proxy+}'
  if (isArcFive && notProxyReq) {
    // This is a deprecated code path that may be removed when Arc 5 exits LTS status
    // Fixes backwards compatibility: Arc vtl needs this param
    res.type = type
  }

  // Set and/or update headers
  let headers = res.headers
  if (cacheControl) headers['Cache-Control'] = cacheControl
  let antiCache = type.includes('text/html') ||
                  type.includes('application/json') ||
                  type.includes('application/vnd.api+json')
  if (headers && !headers['Cache-Control'] && antiCache) {
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
  }
  else if (headers && !headers['Cache-Control']) {
    headers['Cache-Control'] = 'max-age=86400' // Default cache to one day unless otherwise specified
  }
  if (cors) headers['Access-Control-Allow-Origin'] = '*'
  if (params.isBase64Encoded) res.isBase64Encoded = true
  if (params.location) {
    res.statusCode = providedStatus || 302
    res.headers.Location = params.location
  }

  // Handle body encoding (if necessary)
  let isBinary = binaryTypes.some(t => res.headers['Content-Type'].includes(t))
  let bodyIsString = typeof res.body === 'string'
  let b64enc = i => new Buffer.from(i).toString('base64')
  // Encode (and flag) outbound buffers
  if (bodyIsBuffer) {
    res.body = b64enc(res.body)
    res.isBase64Encoded = true
  }
  // Body is likely base64 & has binary MIME type, so flag it
  if (bodyIsString && isBinary) res.isBase64Encoded = true

  return res
}
