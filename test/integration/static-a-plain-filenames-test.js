import {
  equal,
  assert,
  assertExists,
  assertArrayIncludes,
  assertEquals,
} from "https://deno.land/std@0.93.0/testing/asserts.ts"
import { exists, existsSync} from 'https://deno.land/std@0.94.0/fs/mod.ts'
import * as path from "https://deno.land/std@0.93.0/path/mod.ts"
import arcStatic from '../../src/static/index.js'
import arcHttp from '../../src/http/index.js'


const env = Deno.env.toObject()

const join = path.join
const __dirname = path.dirname(path.fromFileUrl(import.meta.url))

//let arc
let mock = join(__dirname, '..', 'mock')
let tmp = join(mock, 'tmp')
let shared = join(tmp, 'node_modules', '@architect', 'shared')

let origRegion = env.AWS_REGION
let origCwd = Deno.cwd()

let resetEnv = () => {
  delete env.AWS_REGION
  delete env.NODE_ENV
  delete env.ARC_STATIC_PREFIX
  delete env.ARC_STATIC_FOLDER
  delete env.ARC_STATIC_BUCKET
}

Deno.test({
  name: 'Set up mocked files', 
  fn: async () => {
    //t.plan(2)
    await Deno.mkdir(shared, { recursive: true })
    
    await Deno.copyFile(join(mock, 'mock-arc'), join(shared, '.arc'))
    await Deno.copyFile(join(mock, 'mock-arc'), join(tmp, '.arc'))
    
    assertEquals(await exists(join(shared, '.arc')), true, 'Mock .arc (shared) file ready')
    assertEquals(await exists(join(tmp, '.arc')), true,  'Mock .arc (root) file ready')
    
    await Deno.chdir(tmp)
  },
  sanitizeResources: false,
  sanitizeOps: false,
})



Deno.test('Local URL tests', async () => {
  //t.plan(7)
  assertEquals(arcStatic('index.html'), '/_static/index.html', 'Basic local static path')
  assertEquals(arcStatic('/index.html'), '/_static/index.html', 'Basic local static path with leading slash')
  assertEquals(arcHttp.helpers.static('index.html'), '/_static/index.html', 'Basic local static path (legacy)')

  env.NODE_ENV = 'testing'
  assertEquals(arcStatic('index.html'), '/_static/index.html', 'Basic local static path (env=testing)')

  env.NODE_ENV = 'staging'
  assertEquals(arcStatic('index.html'), '/_static/index.html', 'Always use /_static')

  delete env.NODE_ENV // Run it "locally"
  env.ARC_STATIC_PREFIX = 'foo'
  assertEquals(arcStatic('index.html'), '/_static/index.html', 'Basic local static path unaffected by ARC_STATIC_PREFIX env var')
  delete env.ARC_STATIC_PREFIX

  env.ARC_STATIC_FOLDER = 'foo'
  assertEquals(arcStatic('index.html'), '/_static/index.html', 'Basic local static path unaffected by ARC_STATIC_FOLDER env var')
  resetEnv()
})

Deno.test('Clean up env', async () => {
  //t.plan(1)
  env.AWS_REGION = origRegion
  env.NODE_ENV = 'testing'
  await Deno.chdir(origCwd)
  await Deno.remove(tmp, { recursive: true })
  assertEquals(await exists(tmp), false, 'Mocks cleaned up')
})
