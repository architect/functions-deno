import test from 'tape'
import arcHttp from '../../../../../src/http/index.js'

// Ensure compatibility with legacy proxy methods
test('Primary proxy method', t => {
  t.plan(6)
  // Current
  let httpProxy = arcHttp.proxy
  t.equal(typeof httpProxy, 'function', 'arcHttp.proxy is a function')
  t.equal(httpProxy.name, 'proxy', 'arcHttp.proxy is the proxy function')

  // Legacy
  let httpProxyPublic = arcHttp.proxy.public
  t.equal(typeof httpProxyPublic, 'function', 'arcHttp.proxy.public is a function')
  t.equal(httpProxyPublic.name, 'proxy', 'arcHttp.proxy.public is the proxy function')

  // Like, really legacy
  /* let proxyPublic = arcHttp.proxy.public
  t.equal(typeof proxyPublic, 'function', 'arc.proxy.public is a function')
  t.equal(proxyPublic.name, 'proxy', 'arc.proxy.public is the proxy function') */
})

test('Secondary proxy.read method (local)', t => {
  t.plan(6)
  let env = process.env.NODE_ENV
  process.env.NODE_ENV = 'testing'

  // Current
  let httpProxyRead = arcHttp.proxy.read
  t.equal(typeof httpProxyRead, 'function', 'arcHttp.proxy.read is a function')
  t.equal(httpProxyRead.name, 'readLocal', 'arcHttp.proxy.read is the readLocal function')

  // Legacy
  let httpProxyPublicRead = arcHttp.proxy.public.read
  t.equal(typeof httpProxyPublicRead, 'function', 'arcHttp.proxy.public.read is a function')
  t.equal(httpProxyPublicRead.name, 'readLocal', 'arcHttp.proxy.public.read is the readLocal function')

  // Like, really legacy
  let proxyPublicRead = arc.proxy.public.read
  t.equal(typeof proxyPublicRead, 'function', 'arc.proxy.public.read is a function')
  t.equal(proxyPublicRead.name, 'readLocal', 'arc.proxy.public.read is the readLocal function')

  process.env.NODE_ENV = env
})

test('Secondary proxy.read method (AWS)', t => {
  t.plan(2)
  // Just check to make sure switching to S3 works
  // Legacy signatures will by default work if above tests pass

  let env = process.env.NODE_ENV
  process.env.NODE_ENV = 'staging'

  import httpProxyRead from '../../../../../src/http/proxy/read.js'

  t.equal(typeof httpProxyRead, 'function', 'arcHttp.proxy.read is a function')
  t.equal(httpProxyRead.name, 'readS3', 'arcHttp.proxy.read is the readS3 function')

  process.env.NODE_ENV = env

  /* DENO updated - unsure what this means / how it would translate to esm
  delete require.cache[require.resolve(read)]
  // eslint-disable-next-line
  require(read)
  */
})
