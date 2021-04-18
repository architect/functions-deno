import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts"
import * as path from "https://deno.land/std@0.93.0/path/mod.ts";
import { compress } from './compress.js'

const env = Deno.env.toObject();
const encoder = new TextEncoder();
/**
 * Normalizes response shape
 */
export default function normalizeResponse (params) {
  let { response, result, Key, isProxy, contentEncoding, config } = params

  let noCache = [
    'text/html',
    'application/json',
    'application/vnd.api+json'
  ]
  response.headers = response.headers || {}

  // Establish Content-Type
  let contentType =
    response.headers['Content-Type'] || // Possibly get content-type passed via proxy plugins
    response.headers['content-type'] || // ...
    result && result.ContentType ||     // Fall back to what came down from S3's metadata
    mime.contentType(path.extname(Key)) // Finally, fall back to the mime type database

  // Set Content-Type
  response.headers['Content-Type'] = contentType

  // Set caching headers
  let neverCache = noCache.some(n => contentType.includes(n))
  if (config.cacheControl) {
    response.headers['Cache-Control'] = config.cacheControl
  }
  else if (neverCache) {
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
  }
  else if (result && result.CacheControl) {
    response.headers['Cache-Control'] = result.CacheControl
  }
  else {
    response.headers['Cache-Control'] = 'public, max-age=0, must-revalidate'
  }

  // Populate optional userland headers
  if (config.headers) {
    Object.keys(config.headers).forEach(h => response.headers[h] = config.headers[h])
  }

  // Normalize important common header casings to prevent dupes
  if (response.headers['content-type']) {
    response.headers['Content-Type'] = response.headers['content-type']
    delete response.headers['content-type']
  }
  // Probably unable to be set via this code path, but normalize jic
  if (response.headers['cache-control']) {
    response.headers['Cache-Control'] = response.headers['cache-control']
    delete response.headers['cache-control']
  }

  let notArcSix = !env.ARC_CLOUDFORMATION
  let notArcProxy = !env.ARC_HTTP || env.ARC_HTTP === 'aws'
  let isArcFive = notArcSix && notArcProxy
  let isHTML = response.headers['Content-Type'].includes('text/html')
  if (isArcFive && isHTML && !isProxy) {
    // This is a deprecated code path that may be removed when Arc 5 exits LTS status
    // Only return string bodies for certain types, and ONLY in Arc 5
    response.body = encoder.encode(request.body)
    response.type = response.headers['Content-Type'] // Re-set type or it will fall back to JSON
  }
  else {
    if (contentEncoding) {
      response.body = compress(contentEncoding, response.body)
      response.headers['Content-Encoding'] = contentEncoding
    }
    // Base64 everything else on the way out to enable text + binary support
    response.body = encoder.encode(request.body)
    response.isBase64Encoded = true
  }

  // Add ETag
  response.headers.ETag = result.ETag

  return response
}
