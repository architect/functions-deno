import { cookie } from '../../../../deps.ts'
import { hmac } from '../../../../deps.ts'
import { Buffer } from '../../../../deps.ts'
import { secureCompare } from '../../../../deps.ts'

import getIdx from '../_get-idx.js'
import find from './find.js'
import create from './create.js'
import update from './update.js'

export default { read, write }

const sign = (val, secret) => {
  if ('string' != typeof val) throw new TypeError('Cookie value must be provided as a string.')
  if ('string' != typeof secret) throw new TypeError('Secret string must be provided.')
  return val + '.' + hmac('sha256', secret, val, 'utf8', 'base64')
}

const unsign = (val, secret) => {
  if ('string' != typeof val) throw new TypeError('Signed cookie string must be provided.')
  if ('string' != typeof secret) throw new TypeError('Secret string must be provided.')
  var str = val.slice(0, val.lastIndexOf('.'))
    , mac = sign(str, secret)
    , macBuffer = Buffer.from(mac)
    , valBuffer = Buffer.alloc(macBuffer.length)

  valBuffer.write(val)

  return (secureCompare('' + macBuffer, '' + valBuffer)) ? str : false
}

/**
 * reads request for session cookie and looks it up in dynamo
 */
function read (request, callback) {

  // be async/await friendly
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }

  // read dynamo session table
  let name = Deno.env.get('SESSION_TABLE_NAME') || tableLogicalId('arc-sessions')
  let secret = Deno.env.get('ARC_APP_SECRET') || Deno.env.get('ARC_APP_NAME') || 'fallback'
  // TODO: uppercase 'Cookie' is not the header name on AWS Lambda; it's
  // lowercase 'cookie' on lambda...
  let rawCookie = request.headers && (request.headers.Cookie || request.headers.cookie)
  // Lambda payload version 2 puts the cookies in an array on the request
  if (!rawCookie && request.cookies) {
    rawCookie = request.cookies.join(';')
  }

  let idx = getIdx(rawCookie)
  let sesh = cookie.parse(idx)._idx
  let valid = unsign(sesh || '', secret)

  // find or create a new session
  let exec = sesh && valid ? find.bind({}, name) : create.bind({}, name)
  let params = sesh && valid ? valid : {}

  exec(params, callback)
  return promise
}

/**
 * expect params to be
 * - _idx
 * - _secret
 */
function write (params, callback) {
  // be async/await friendly
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }

  // read dynamo session table
  let name = Deno.env.get('SESSION_TABLE_NAME') || tableLogicalId('arc-sessions')
  let secret = Deno.env.get('ARC_APP_SECRET') || Deno.env.get('ARC_APP_NAME') || 'fallback'

  update(name, params, function _update (err) {
    if (err) {
      callback(err)
    }
    else {
      let maxAge = Deno.env.get('SESSION_TTL') || 7.884e+8
      let options = {
        maxAge,
        expires: new Date(Date.now() + maxAge * 1000),
        secure: true,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
      }
      if (Deno.env.get('SESSION_DOMAIN')) {
        options.domain = Deno.env.get('SESSION_DOMAIN')
      }
      if (Deno.env.get('NODE_ENV') === 'testing')
        delete options.secure
      let result = cookie.serialize('_idx', sign(params._idx, secret), options)
      callback(null, result)
    }
  })

  return promise
}

function tableLogicalId (name) {
  let _env = Deno.env.get('NODE_ENV') === 'production' ? 'production' : 'staging'
  return `${_env.ARC_APP_NAME}-${_env}-${name}`
}
