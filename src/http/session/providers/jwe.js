import { cookie } from '../deps.ts'
import { djwtCreate, getNumericDate, verify } from '../deps.ts'
import { Buffer } from '../deps.ts'

import getIdx from './_get-idx.js'
// let alg = 'dir'
let enc = 'HS256'

// 128bit key size
let fallback = Buffer.from('1234567890123456').toString('base64')

// need to STRONGLY encourage setting ARC_APP_SECRET in the docs
let key = Deno.env.get('ARC_APP_SECRET') || fallback

let jwe = {
  async create (payload) {
    const WEEK = 604800
    return await djwtCreate({ alg: enc, typ: 'JWT' }, { iat: getNumericDate(0), exp: getNumericDate(WEEK), ...payload }, key)
  },
  async parse (token) {
    return await verify(token, key, enc)
  }
}

/**
 * reads req cookie and returns token payload or an empty object
 */
async function read (req, callback) {
  let promise
  if (!callback) {
    promise = new Promise(function argh (res, rej) {
      callback = function errback (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }
  let rawCookie = req.headers && (req.headers.cookie || req.headers.Cookie)
  // Lambda payload version 2 puts the cookies in an array on the request
  if (!rawCookie && req.cookies) {
    rawCookie = req.cookies.join(';')
  }

  let idx = getIdx(rawCookie)
  let sesh = cookie.parse(idx)._idx
  try {
    let payload = await jwe.parse(sesh)
    callback(null, payload)
  }
  catch (e) {
    callback(null, {})
  }



  return promise
}

/**
 * creates a Set-Cookie header with token payload encrypted
 */
async function write (payload, callback) {
  let promise
  if (!callback) {
    promise = new Promise(function ugh (res, rej) {
      callback = function errback (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }
  let key = '_idx'
  let val = await jwe.create(payload)
  let maxAge = Deno.env.get('SESSION_TTL') || 7.884e+8
  let sameSite = Deno.env.get('ARC_SESSION_SAME_SITE') || 'lax'
  let options = {
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
    secure: true,
    httpOnly: true,
    path: '/',
    sameSite,
  }
  if (Deno.env.get('SESSION_DOMAIN')) {
    options.domain = Deno.env.get('SESSION_DOMAIN')
  }
  if (Deno.env.get('NODE_ENV') === 'testing') {
    delete options.secure
  }
  callback(null, cookie.serialize(key, val, options))
  return promise
}

export default { read, write }
