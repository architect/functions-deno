
import * as path from "https://deno.land/std@0.93.0/path/mod.ts"
import {
  equal,
  assert,
  assertExists,
  assertArrayIncludes,
  assertEquals,
} from "https://deno.land/std@0.93.0/testing/asserts.ts"
import { readLines } from "https://deno.land/std@0.93.0/io/mod.ts";

const env = Deno.env.toObject()

const join = path.join
const __dirname = path.dirname(path.fromFileUrl(import.meta.url))


let port = env.PORT ? env.PORT : '3333'
let url = s => `http://localhost:${port}${s ? s : ''}`


async function getSession (url) {
  let headers = { cookie }
  const response = await fetch(url, {
    method: 'GET',
    withCredentials: true,
    credentials: 'include',
    headers: headers
  })
  return JSON.parse(await response.json())
  
}

function checkKeys (session, t) {
  let { _idx, _secret, _ttl } = session
  
  if (!_idx || !_secret || !_ttl) validKeys = false
  else validKeys = true 

  if (!validKeys) assert(validKeys, `Did not get back all internal session keys: ${JSON.stringify(session, null, 2)}`)
  else assert(validKeys, `Got back internal session keys: _idx, _secret, _ttl`)
}


let cookie // Assigned at setup
let mock = join(__dirname, '..', 'mock', 'project')
let origCwd = Deno.cwd()

async function read(stdout) {
  
  for await (const line of readLines(stdout)) {
    return line;
  }
}

/*
Deno.test({
  name: "Set up env", 
  fn: async () => {
    env.SESSION_TABLE_NAME = 'test-only-staging-arc-sessions'
    Deno.chdir(mock)
    //console.log(Deno.cwd())
    //console.log(mock)
    assertEquals(Deno.cwd(), mock, "Set working dir");

    const cmd = Deno.run({
      cmd: ["arc", "sandbox"], 
      stdout: "piped",
      stderr: "piped"
    });
  
    let result
    let checkComplete = false
    while(!checkComplete) {
      let line = await read(cmd.stdout)
      if(line.indexOf('Local environment ready!') !== -1) {
          checkComplete = true
          await Deno.close(cmd.rid)
          result = line
      }
    }
    assertEquals(result, '❤︎ Local environment ready!', result)
  },
  sanitizeResources: false,
  sanitizeOps: false,
}); 

//having to use the object syntax to pass in sanitizeResources: false,  sanitizeOps: false, as I can't figure out how to prevent "Make sure to close all open resource handles returned from Deno APIs before" error?
*/


Deno.test('Create an initial session', async t => {
  
  const response = await fetch(url('/http-session'))
  const result = await response.text()
  cookie = response.headers.get('set-cookie')
  assertExists(cookie, `Got cookie to use in sessions: ${cookie.substr(0, 50)}...`)
})

/*
Deno.test('Do session stuff (arc.http)', async t => {
  
  let session

  // Unpopulated session
  session = await getSession(url('/http-session'))
  console.log(Object.keys(session).length)
  console.log(JSON.stringify(session, null, 2))
  assertEquals(Object.keys(session).length, 3, 'Got back an unpopulated session')
  checkKeys(session, t)

  // Add a data point
  session = await getSession(url('/http-session?session=create'))
  assertEquals(Object.keys(session).length, 4, 'Got back a populated session')
  let unique = session.unique
  t.ok(unique, `Got a unique data point created from session, ${unique}`)
  checkKeys(session, t)

  // Persist it across requests
  session = await getSession(url('/http-session'))
  assertEquals(Object.keys(session).length, 4, 'Got back a populated session')
  assertEquals(session.unique, unique, `Unique data point persisted in session across requests`)
  checkKeys(session, t)

  // Update the session
  session = await getSession(url('/http-session?session=update'))
  assertEquals(Object.keys(session).length, 5, 'Got back a populated session')
  assert(session.another, `Got an updated data data point from session, ${session.another}`)
  checkKeys(session, t)

  // Destroy the session
  session = await getSession(url('/http-session?session=destroy'))
  equal(session, {}, 'Session destroyed')

  // Unpopulated session again!
  session = await getSession(url('/http-session'))
  assertEquals(Object.keys(session).length, 3, 'Got back an unpopulated session')
  checkKeys(session, t)
})
*/

/*
test('Do session stuff (arc.http.async)', async t => {
  t.plan(14)
  let session

  // Unpopulated session
  session = await getSession(url('/http-async-session'))
  assertEquals(Object.keys(session).length, 3, 'Got back an unpopulated session')
  checkKeys(session, t)

  // Add a data point
  session = await getSession(url('/http-async-session?session=create'))
  assertEquals(Object.keys(session).length, 4, 'Got back a populated session')
  let unique = session.unique
  t.ok(unique, `Got a unique data point created from session, ${unique}`)
  checkKeys(session, t)

  // Persist it across requests
  session = await getSession(url('/http-async-session'))
  assertEquals(Object.keys(session).length, 4, 'Got back a populated session')
  assertEquals(session.unique, unique, `Unique data point persisted in session across requests`)
  checkKeys(session, t)

  // Update the session
  session = await getSession(url('/http-async-session?session=update'))
  assertEquals(Object.keys(session).length, 5, 'Got back a populated session')
  t.ok(session.another, `Got an updated data data point from session, ${session.another}`)
  checkKeys(session, t)

  // Destroy the session
  session = await getSession(url('/http-async-session?session=destroy'))
  t.deepEqual(session, {}, 'Session destroyed')

  // Unpopulated session again!
  session = await getSession(url('/http-async-session'))
  assertEquals(Object.keys(session).length, 3, 'Got back an unpopulated session')
  checkKeys(session, t)
}) */