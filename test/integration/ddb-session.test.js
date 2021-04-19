
import * as path from "https://deno.land/std@0.93.0/path/mod.ts"
import {
  assertArrayIncludes,
  assertEquals,
} from "https://deno.land/std@0.93.0/testing/asserts.ts"
import { readLines } from "https://deno.land/std@0.93.0/io/mod.ts";

const env = Deno.env.toObject()

const join = path.join
const __dirname = path.dirname(path.fromFileUrl(import.meta.url))


let port = env.PORT ? env.PORT : '3333'
let url = s => `http://localhost:${port}${s ? s : ''}`

/*
async function getSession (url) {
  let headers = { cookie }
  let result = await tiny.get({ url, headers })
  return JSON.parse(result.body)
}

function checkKeys (session, t) {
  let { _idx, _secret, _ttl } = session
  if (!_idx || !_secret || !_ttl) t.fail(`Did not get back all internal session keys: ${JSON.stringify(session, null, 2)}`)
  else t.pass('Got back internal session keys: _idx, _secret, _ttl')
}
*/

let cookie // Assigned at setup
let mock = join(__dirname, '..', 'mock', 'project')
let origCwd = Deno.cwd()

async function read(stdout) {
  
  for await (const line of readLines(stdout)) {
    return line;
  }
}


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

