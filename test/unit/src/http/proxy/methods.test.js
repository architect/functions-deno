import {dotEnvConfig} from '../../../../deps.ts'
dotEnvConfig({ export: true })
import { assertEquals } from '../../../../deps.ts'

import arc from '../../../../../src/index.js'

// Ensure compatibility with legacy proxy methods
Deno.test({
  name: 'Primary proxy method', 
  fn: () => {
    //t.plan(6)
    // Current

    console.log(arc.http)

    let httpProxy = arc.http.proxy
    assertEquals(typeof httpProxy, 'function', 'arc.http.proxy is a function')
    assertEquals(httpProxy.name, 'proxy', 'arc.http.proxy is the proxy function')

    // Legacy
    let httpProxyPublic = arc.http.proxy.public
    assertEquals(typeof httpProxyPublic, 'function', 'arc.http.proxy.public is a function')
    assertEquals(httpProxyPublic.name, 'proxy', 'arc.http.proxy.public is the proxy function')

    // Like, really legacy
    /* let proxyPublic = arc.http.proxy.public
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
    let httpProxyRead = arc.http.proxy.read
    assertEquals(typeof httpProxyRead, 'function', 'arc.http.proxy.read is a function')
    assertEquals(httpProxyRead.name, 'readLocal', 'arc.http.proxy.read is the readLocal function')

    // Legacy
    let httpProxyPublicRead = arc.http.proxy.public.read
    assertEquals(typeof httpProxyPublicRead, 'function', 'arc.http.proxy.public.read is a function')
    assertEquals(httpProxyPublicRead.name, 'readLocal', 'arc.http.proxy.public.read is the readLocal function')

    // Like, really legacy
    let proxyPublicRead = arc.http.proxy.public.read
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

    assertEquals(typeof httpProxyRead, 'function', 'arc.http.proxy.read is a function')
    assertEquals(httpProxyRead.name, 'readS3', 'arc.http.proxy.read is the readS3 function')

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
