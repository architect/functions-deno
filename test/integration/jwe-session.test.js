import * as path from "https://deno.land/std@0.93.0/path/mod.ts"
import {
  equal,
  assert,
  assertExists,
  assertArrayIncludes,
  assertEquals,
} from "https://deno.land/std@0.93.0/testing/asserts.ts"
import { DenoSandbox, read } from '../deno-sandbox.js';

const join = path.join
const __dirname = path.dirname(path.fromFileUrl(import.meta.url))

let port = Deno.env.get('PORT') ? Deno.env.get('PORT') : '3333'
let url = s => `http://localhost:${port}${s ? s : ''}`

async function getSession (url) {
  let headers = { cookie }
  const response = await fetch(url, {
    method: 'GET',
    withCredentials: true,
    credentials: 'include',
    headers: headers
  })
  const json = await response.json()
  console.log(json)
  return JSON.parse(json)
    
}

/* 
  DENO: due to no availbability of library that uses the A128GCM algorithm, JWT tokens are defined uniquely (not currently compat with node/ruby/pyhtin version of arc-functions) 
  Deno default session sig is like {iat: 1619029172, exp: 1619029172} i.e. exp baked into the the token headers
*/
function checkKeys (session) {
    let { iat, exp} = session
    let validKeys
  
    if (!iat || !exp) validKeys = false
    else validKeys = true 
  
    if (!validKeys) assert(validKeys, `Did not get back all internal session keys: ${JSON.stringify(session, null, 2)}`)
    else assert(validKeys, `Got back internal session keys: iat, exp`)
  }

let cookie // Assigned at setup
let mock = join(__dirname, '..', 'mock', 'project')
let origCwd = Deno.cwd()

Deno.env.set('SESSION_TABLE_NAME', 'jwe')
const sandbox = new DenoSandbox(false, mock, Deno.env.toObject());

Deno.test({
    name: "Set up env", 
    fn: async () => {
      
      Deno.chdir(mock)
    
      assertEquals(Deno.cwd(), mock, "Set working dir");
  
      const cmd = sandbox.start();
    
      let result
      let checkComplete = false
      while(!checkComplete) {
        let line = await read(cmd.stdout)
       
        if(line.indexOf('Local environment ready!') !== -1) {
            checkComplete = true
            result = line
        }
      }
  
      assertEquals(result, '❤︎ Local environment ready!', result)
    },
    sanitizeResources: false,
    sanitizeOps: false,
}); 

Deno.test('Create an initial session', async () => {
  
  const response = await fetch(url('/http-session'))
  const result = await response.text()
  cookie = response.headers.get('set-cookie')
  
  assertExists(cookie, `Got cookie to use in sessions: ${cookie.substr(0, 50)}...`)
})

Deno.test('Do session stuff (arc.http)', async () => {
  
  let session

  // Unpopulated session
  session = await getSession(url('/http-session'))
  assertEquals(Object.keys(session).length, 2, 'Got back an unpopulated session')
  checkKeys(session)

  // Add a data point
  session = await getSession(url('/http-session?session=create'))
  assertEquals(Object.keys(session).length, 3, 'Got back a populated session')
  let unique = session.unique
  assertExists(unique, `Got a unique data point created from session, ${unique}`)
  checkKeys(session)

  // Persist it across requests
  session = await getSession(url('/http-session'))
  assertEquals(Object.keys(session).length, 3, 'Got back a populated session')
  assertEquals(session.unique, unique, `Unique data point persisted in session across requests`)
  checkKeys(session)

  // Update the session
  session = await getSession(url('/http-session?session=update'))
  assertEquals(Object.keys(session).length, 4, 'Got back a populated session')
  assertExists(session.another, `Got an updated data data point from session, ${session.another}`)
  checkKeys(session)

  // Destroy the session
  session = await getSession(url('/http-session?session=destroy'))
  equal(session, {}, 'Session destroyed')

  // Unpopulated session again!
  session = await getSession(url('/http-session'))
  assertEquals(Object.keys(session).length, 2, 'Got back an unpopulated session')
  checkKeys(session)
})

Deno.test('Do session stuff (arc.http.async)', async () => {
  
  let session

  // Unpopulated session
  session = await getSession(url('/http-async-session'))
  assertEquals(Object.keys(session).length, 2, 'Got back an unpopulated session')
  checkKeys(session)

  // Add a data point
  session = await getSession(url('/http-async-session?session=create'))
  assertEquals(Object.keys(session).length, 3, 'Got back a populated session')
  let unique = session.unique
  assertExists(unique, `Got a unique data point created from session, ${unique}`)
  checkKeys(session)

  // Persist it across requests
  session = await getSession(url('/http-async-session'))
  assertEquals(Object.keys(session).length, 3, 'Got back a populated session')
  assertEquals(session.unique, unique, `Unique data point persisted in session across requests`)
  checkKeys(session)

  // Update the session
  session = await getSession(url('/http-async-session?session=update'))
  assertEquals(Object.keys(session).length, 4, 'Got back a populated session')
  assertExists(session.another, `Got an updated data data point from session, ${session.another}`)
  checkKeys(session)

  // Destroy the session
  session = await getSession(url('/http-async-session?session=destroy'))
  equal(session, {}, 'Session destroyed')

  // Unpopulated session again!
  session = await getSession(url('/http-async-session'))
  assertEquals(Object.keys(session).length, 2, 'Got back an unpopulated session')
  checkKeys(session)
})

Deno.test({
    name: "Teardown", 
    fn: async () => {
    
        sandbox.stop();
        Deno.env.delete('SESSION_TABLE_NAME')
        Deno.chdir(origCwd)
        assertEquals(Deno.cwd(), origCwd, 'Reset working dir')
    },
    sanitizeResources: false,
    sanitizeOps: false
})
