import arcHttp from '../../../../../src/http/index.js'
import {
    assert,
    AssertionError,
    assertEquals,
    assertExists,
    assertNotEquals,
  } from "https://deno.land/std@0.93.0/testing/asserts.ts"

// Ensure compatibility with legacy proxy methods
Deno.test({
  name: 'Primary proxy method', 
  fn: () => {
    //t.plan(6)
    // Current
    let httpProxy = arcHttp.proxy
    assertEquals(typeof httpProxy, 'function', 'arcHttp.proxy is a function')
    assertEquals(httpProxy.name, 'proxy', 'arcHttp.proxy is the proxy function')

    // Legacy
    let httpProxyPublic = arcHttp.proxy.public
    assertEquals(typeof httpProxyPublic, 'function', 'arcHttp.proxy.public is a function')
    assertEquals(httpProxyPublic.name, 'proxy', 'arcHttp.proxy.public is the proxy function')

    // Like, really legacy
    /* let proxyPublic = arcHttp.proxy.public
    t.equal(typeof proxyPublic, 'function', 'arc.proxy.public is a function')
    t.equal(proxyPublic.name, 'proxy', 'arc.proxy.public is the proxy function') */
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Secondary proxy.read method (local)', 
  fn: () => {
    //t.plan(6)
    let env = Deno.env.get('NODE_ENV')
    Deno.env.set('NODE_ENV', 'testing')

    // Current
    let httpProxyRead = arcHttp.proxy.read
    assertEquals(typeof httpProxyRead, 'function', 'arcHttp.proxy.read is a function')
    assertEquals(httpProxyRead.name, 'readLocal', 'arcHttp.proxy.read is the readLocal function')

    // Legacy
    let httpProxyPublicRead = arcHttp.proxy.public.read
    assertEquals(typeof httpProxyPublicRead, 'function', 'arcHttp.proxy.public.read is a function')
    assertEquals(httpProxyPublicRead.name, 'readLocal', 'arcHttp.proxy.public.read is the readLocal function')

    // Like, really legacy
    let proxyPublicRead = arcHttp.proxy.public.read
    assertEquals(typeof proxyPublicRead, 'function', 'arc.proxy.public.read is a function')
    assertEquals(proxyPublicRead.name, 'readLocal', 'arc.proxy.public.read is the readLocal function')

    Deno.env.set('NODE_ENV', env)
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Secondary proxy.read method (AWS)', 
  fn: async () => {
    //t.plan(2)
    // Just check to make sure switching to S3 works
    // Legacy signatures will by default work if above tests pass

    let env = Deno.env.get('NODE_ENV')
    Deno.env.set('NODE_ENV', 'staging')

    const httpProxyRead = (await import(`../../../../../src/http/proxy/read/index.js?v=${Math.random()}`)).default

    assertEquals(typeof httpProxyRead, 'function', 'arcHttp.proxy.read is a function')
    assertEquals(httpProxyRead.name, 'readS3', 'arcHttp.proxy.read is the readS3 function')

    Deno.env.set('NODE_ENV', env)

    /* DENO updated - unsure what this means / how it would translate to esm
    delete require.cache[require.resolve(read)]
    // eslint-disable-next-line
    require(read)
    */
  },
  sanitizeResources: false,
  sanitizeOps: false
})
