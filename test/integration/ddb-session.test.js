import {dotEnvConfig} from '../deps.ts'
dotEnvConfig({ export: true })

import {path} from "../deps.ts"
import {
  equal,
  assert,
  assertExists,
  assertEquals,
} from "../deps.ts"
import { DenoSandbox, read } from "../deps.ts"

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

  return JSON.parse(json)
  
}

function checkKeys (session) {
  let { _idx, _secret, _ttl } = session
  let validKeys

  if (!_idx || !_secret || !_ttl) validKeys = false
  else validKeys = true 

  if (!validKeys) assert(validKeys, `Did not get back all internal session keys: ${JSON.stringify(session, null, 2)}`)
  else assert(validKeys, `Got back internal session keys: _idx, _secret, _ttl`)
}


let cookie // Assigned at setup
let mock = join(__dirname, '..', 'mock', 'project')
let origCwd = Deno.cwd()



Deno.env.set('SESSION_TABLE_NAME', 'test-only-staging-arc-sessions')

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

//having to use the object syntax to pass in sanitizeResources: false,  sanitizeOps: false, as I can't figure out how to prevent "Make sure to close all open resource handles returned from Deno APIs before" error?


Deno.test('Create an initial session', async () => {
  
  const response = await fetch(url('/http-session'))
  const result = await response.text()
  //console.log(response)
  cookie = response.headers.get('set-cookie')
  assertExists(cookie, `Got cookie to use in sessions: ${cookie.substr(0, 50)}...`)
})


Deno.test('Do session stuff (arc.http)', async () => {
  
  let session

  // Unpopulated session
  session = await getSession(url('/http-session'))
  assertEquals(Object.keys(session).length, 3, 'Got back an unpopulated session')
  checkKeys(session)

  // Add a data point
  session = await getSession(url('/http-session?session=create'))
  assertEquals(Object.keys(session).length, 4, 'Got back a populated session')
  let unique = session.unique
  assertExists(unique, `Got a unique data point created from session, ${unique}`)
  checkKeys(session)

  // Persist it across requests
  session = await getSession(url('/http-session'))
  assertEquals(Object.keys(session).length, 4, 'Got back a populated session')
  assertEquals(session.unique, unique, `Unique data point persisted in session across requests`)
  checkKeys(session)

  // Update the session
  session = await getSession(url('/http-session?session=update'))
  assertEquals(Object.keys(session).length, 5, 'Got back a populated session')
  assertExists(session.another, `Got an updated data data point from session, ${session.another}`)
  checkKeys(session)

  // Destroy the session
  session = await getSession(url('/http-session?session=destroy'))
  equal(session, {}, 'Session destroyed')

  // Unpopulated session again!
  session = await getSession(url('/http-session'))
  assertEquals(Object.keys(session).length, 3, 'Got back an unpopulated session')
  checkKeys(session)
})

Deno.test('Do session stuff (arc.http.async)', async () => {
  //t.plan(14)
  let session

  // Unpopulated session
  session = await getSession(url('/http-async-session'))
  assertEquals(Object.keys(session).length, 3, 'Got back an unpopulated session')
  checkKeys(session)

  // Add a data point
  session = await getSession(url('/http-async-session?session=create'))
  assertEquals(Object.keys(session).length, 4, 'Got back a populated session')
  let unique = session.unique
  assertExists(unique, `Got a unique data point created from session, ${unique}`)
  checkKeys(session)

  // Persist it across requests
  session = await getSession(url('/http-async-session'))
  assertEquals(Object.keys(session).length, 4, 'Got back a populated session')
  assertEquals(session.unique, unique, `Unique data point persisted in session across requests`)
  checkKeys(session)

  // Update the session
  session = await getSession(url('/http-async-session?session=update'))
  assertEquals(Object.keys(session).length, 5, 'Got back a populated session')
  assertExists(session.another, `Got an updated data data point from session, ${session.another}`)
  checkKeys(session)

  // Destroy the session
  session = await getSession(url('/http-async-session?session=destroy'))
  equal(session, {}, 'Session destroyed')

  // Unpopulated session again!
  session = await getSession(url('/http-async-session'))
  assertEquals(Object.keys(session).length, 3, 'Got back an unpopulated session')
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