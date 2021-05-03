import * as path from "https://deno.land/std@0.93.0/path/mod.ts"
const join = path.join
import { DenoSandbox, read as sandboxRead } from '../../../../deno-sandbox.js';
import {
  assert,
  AssertionError,
  assertEquals,
  assertExists,
  assertNotEquals
} from "https://deno.land/std@0.93.0/testing/asserts.ts"

let sandbox

Deno.test({
  name: 'http.session apis exist', 
  fn: async () => {
    //t.plan(2)

    Deno.env.set('SESSION_TABLE_NAME', 'jwe')

    const read = (await import(`../../../../../src/http/session/read.js?v=${Math.random()}`)).default
    const write = (await import(`../../../../../src/http/session/write.js?v=${Math.random()}`)).default
  
    assert(read, 'http.session.read')
    assert(write, 'http.session.write')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'jwe read and write implementations', 
  fn: async () => {
    //t.plan(5)
    Deno.env.set('SESSION_TABLE_NAME', 'jwe')
    Deno.env.set('SESSION_TTL', '14400')

    //needed to pick-up correct env vars
    const read = (await import(`../../../../../src/http/session/read.js?v=${Math.random()}`)).default
    const write = (await import(`../../../../../src/http/session/write.js?v=${Math.random()}`)).default

    let fakerequest = {}
    
    let session = await read(fakerequest)
    assert(session, 'read session cookie')
    session.one = 1
    let cookie = await write(session)
    assert(cookie, 'wrote session cookie')
    let inception = await read({ headers: { Cookie: cookie } })
    //t.comment(JSON.stringify(session))
    //t.comment(JSON.stringify(cookie))
    //t.comment(JSON.stringify(inception))
    assert(inception.one === 1, 'read back again')
    // Lambda payload version 2
    let inception2 = await read({ cookies: [ cookie ] })
    assert(inception2.one === 1, 'read back again from payload version 2')
    assert(cookie.includes(`Max-Age=${Deno.env.get('SESSION_TTL')}`), 'cookie max-age is set correctly')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'jwe SameSite is configurable', 
  fn: async () => {
    //t.plan(2)
    Deno.env.set('SESSION_TABLE_NAME', 'jwe')
    Deno.env.set('SESSION_TTL', '14400')

    const read = (await import(`../../../../../src/http/session/read.js?v=${Math.random()}`)).default
    const write = (await import(`../../../../../src/http/session/write.js?v=${Math.random()}`)).default

    let session = {}
    // default value:
    Deno.env.delete('ARC_SESSION_SAME_SITE')
    let cookie = await write(session)
    assert(cookie.includes(`SameSite=Lax`), 'cookie SameSite is set correctly to default')
    // configured value:
    Deno.env.set('ARC_SESSION_SAME_SITE', 'None')
    cookie = await write(session)
    assert(cookie.includes(`SameSite=${Deno.env.get('ARC_SESSION_SAME_SITE')}`), 'cookie SameSite is set correctly to configured value')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'set up sandbox for ddb testing', 
  fn: async () => {
    //t.plan(1)
    sandbox = new DenoSandbox(false, join(Deno.cwd(), 'test', 'mock', 'project'), Deno.env.toObject());
    
    const cmd = sandbox.start();
    let result
    let checkComplete = false
    while(!checkComplete) {
      let line = await sandboxRead(cmd.stdout)
      
      if(line.indexOf('Local environment ready!') !== -1) {
          checkComplete = true
          result = line
      }
    }

    assertEquals(result, '❤︎ Local environment ready!', result)
    
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'ddb read and write implementations', 
  fn: async () => {
    //t.plan(5)
    Deno.env.set('SESSION_TABLE_NAME', 'test-only-staging-arc-sessions')
    Deno.env.set('SESSION_TTL', '14400')

    const read = (await import(`../../../../../src/http/session/read.js?v=${Math.random()}`)).default
    const write = (await import(`../../../../../src/http/session/write.js?v=${Math.random()}`)).default

    let fakerequest = {}
    let session = await read(fakerequest)
    assert(session, 'read session cookie')
    session.one = 1
    let cookie = await write(session)
    assert(cookie, 'wrote modified session cookie')
    let inception = await read({ headers: { Cookie: cookie } })
    //t.comment(JSON.stringify(session))
    //t.comment(JSON.stringify(cookie))
    //t.comment(JSON.stringify(inception))
    assertEquals(inception.one, 1, 'read back modified cookie')
    // Lambda payload version 2
    let inception2 = await read({ cookies: [ cookie ] })
    assert(inception2.one === 1, 'read back again from payload version 2')
    assert(cookie.includes(`Max-Age=${Deno.env.get('SESSION_TTL')}`), 'cookie max-age is set correctly')
  },
  sanitizeResources: false,
  sanitizeOps: false
})


Deno.test({
  name: 'shutdown sandbox', 
  fn: () => {
    //t.plan(1)
    Deno.env.delete('SESSION_TABLE_NAME')
    Deno.env.delete('SESSION_TTL')
    
    sandbox.stop()

    assertEquals(Deno.env.get('SESSION_TABLE_NAME'), undefined)
    assertEquals(Deno.env.get('SESSION_TTL'), undefined)
  },
  sanitizeResources: false,
  sanitizeOps: false
})
