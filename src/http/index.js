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
import proxy, {read as proxyRead, public as proxyPublic} from './proxy/index.js'

const arcHttp = {
  http,
  helpers: {
    bodyParser,
    interpolate,
    static: _static,
    url
  },
  session: { read, write },
  async: _async,
  express,
  proxy: {
    proxy,
    public: proxyRead,
    read: proxyPublic
  },
  middleware: _async
}

export default arcHttp
