import getIdx from './_get-idx.js'
import cookie from 'https://cdn.skypack.dev/pin/cookie@v0.4.1-guhSEbcHMyyU68A3z2sB/mode=imports,min/optimized/cookie.js'
import jwt from 'https://cdn.skypack.dev/node-webtokens'
import { create as djwtCreate, getNumericDate } from 'https://deno.land/x/djwt@v2.2/mod.ts'
let alg = 'dir'
let enc = 'HS256'

const env = Deno.env.toObject();
const encoder = new TextEncoder();

// 128bit key size
let fallback = btoa('1234567890123456')

// need to STRONGLY encourage setting ARC_APP_SECRET in the docs
let key = env.ARC_APP_SECRET || fallback

let jwe = {
  async create (payload) {
    return await djwtCreate({ alg: enc, typ: "JWT" }, payload, key)
  },
  parse (token) {
    const WEEK = 604800
    return jwt.parse(token).setTokenLifetime(WEEK).verify(key)
  }
}

/**
 * reads req cookie and returns token payload or an empty object
 */
function read (req, callback) {
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
  let token = jwe.parse(sesh)
  callback(null, token.valid ? token.payload : {})
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
  let val = jwe.create(payload)
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
