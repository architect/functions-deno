import { assert, assertEquals } from "https://deno.land/std@0.93.0/testing/asserts.ts"
import { exists, existsSync} from 'https://deno.land/std@0.94.0/fs/mod.ts'
import * as path from "https://deno.land/std@0.93.0/path/mod.ts"
import arcStatic from '../../src/static/index.js'
import { createRequire } from "https://deno.land/std@0.93.0/node/module.ts";
const require = createRequire(import.meta.url);

const env = Deno.env.toObject()

const join = path.join
const __dirname = path.dirname(path.fromFileUrl(import.meta.url))

//let arc
let mock = join(__dirname, '..', 'mock')
let tmp = join(mock, 'tmp')
let shared = join(tmp, 'node_modules', '@architect', 'shared')

let origRegion = env.AWS_REGION
let origCwd = Deno.cwd()

let _static

Deno.test('Set up mocked arc', async () => {
  //t.plan(2)
  Deno.mkdir(shared, { recursive: true })
  await Deno.mkdir(shared, { recursive: true })
  await Deno.copyFile(join(mock, 'mock-arc-fingerprint'), join(shared, '.arc'))
  await Deno.copyFile(join(mock, 'mock-arc-fingerprint'), join(tmp, '.arc'))
  assertEquals(await exists(join(shared, '.arc')), true, 'Mock .arc (shared) file ready')
  assertEquals(await exists(join(tmp, '.arc')), true,  'Mock .arc (root) file ready')
  Deno.chdir(tmp)

})

Deno.test('Fingerprinting only enabled if static manifest is found', () => {
  //t.plan(1)
  env.AWS_REGION = 'us-west-1'
  env.NODE_ENV = 'production'
  arcStatic('index.html', { reload: true })
  assertEquals(arcStatic('index.html'), '/_static/index.html')
})

Deno.test('Set up mocked static manifest', async () => {
  //t.plan(2)
  await Deno.copyFile(join(mock, 'mock-static'), join(shared, 'static.json'))
  assertEquals(await exists(join(shared, 'static.json')), true, 'Mock static.json file ready')
  // eslint-disable-next-line
  _static = require(join(shared, 'static.json'))
  assert(_static['index.html'], 'Static manifest loaded')
})

Deno.test('Clean up env', async () => {
  //t.plan(1)
  delete env.ARC_STATIC_BUCKET
  delete env.ARC_STATIC_PREFIX
  delete env.ARC_STATIC_FOLDER
  env.AWS_REGION = origRegion
  env.NODE_ENV = 'testing'
  await Deno.chdir(origCwd)
  await Deno.remove(tmp, { recursive: true })
  assertEquals(await exists(tmp), false, 'Mocks cleaned up')
})
