import getIdx from './_get-idx.js'
import cookie from 'https://cdn.skypack.dev/pin/cookie@v0.4.1-guhSEbcHMyyU68A3z2sB/mode=imports,min/optimized/cookie.js'
import { create as djwtCreate, getNumericDate, verify } from 'https://deno.land/x/djwt@v2.2/mod.ts'
import { Buffer } from 'https://deno.land/std@0.93.0/node/buffer.ts'
// let alg = 'dir'
let enc = 'HS256'

const env = Deno.env.toObject()

// 128bit key size
let fallback = Buffer.from('1234567890123456').toString('base64')

// need to STRONGLY encourage setting ARC_APP_SECRET in the docs
let key = env.ARC_APP_SECRET || fallback

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
  let maxAge = env.SESSION_TTL || 7.884e+8
  let sameSite = env.ARC_SESSION_SAME_SITE || 'lax'
  let options = {
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
    secure: true,
    httpOnly: true,
    path: '/',
    sameSite,
  }
  if (env.SESSION_DOMAIN) {
    options.domain = env.SESSION_DOMAIN
  }
  if (env.NODE_ENV === 'testing') {
    delete options.secure
  }
  callback(null, cookie.serialize(key, val, options))
  return promise
}

export default { read, write }
