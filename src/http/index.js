// HTTP
import http from './http.js'

// HTTP helpers
import bodyParser from './helpers/body-parser.js'
import interpolate from './helpers/params.js'
import _static from '../static/index.js'
import url from './helpers/url.js'

// Session
import read from './session/read.js'
import write from './session/write.js'

// Middleware
import _async from './async/index.js'
import express from './express/index.js'

// Proxy
import proxy from './proxy/index.js'


http.helpers = {
  bodyParser,
  interpolate,
  static: _static,
  url
}
http.session = { read, write }
http.async = _async
http.express = express
http.proxy = proxy.proxy

// Legacy methods
http.proxy.public = proxy.proxy
http.proxy.read = proxy.read
http.middleware = _async

export default http
