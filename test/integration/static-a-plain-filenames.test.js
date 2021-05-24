import {dotEnvConfig} from '../deps.ts'
dotEnvConfig({ export: true })

import { exists } from "../deps.ts"
import {path} from "../deps.ts"
import {assertEquals} from "../deps.ts"

import arc from '../../src/index.js'



const join = path.join
const __dirname = path.dirname(path.fromFileUrl(import.meta.url))

//let arc
let mock = join(__dirname, '..', 'mock')
let tmp = join(mock, 'tmp')
let shared = join(tmp, 'vendor', 'shared')

let origRegion = Deno.env.get('AWS_REGION')
let origCwd = Deno.cwd()

let resetEnv = () => {
  Deno.env.delete('AWS_REGION')
  Deno.env.delete('NODE_ENV')
  Deno.env.delete('ARC_STATIC_PREFIX')
  Deno.env.delete('ARC_STATIC_FOLDER')
  Deno.env.delete('ARC_STATIC_BUCKET')
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



Deno.test('Local URL tests', () => {
  //t.plan(7)
  assertEquals(arc.static('index.html'), '/_static/index.html', 'Basic local static path')
  assertEquals(arc.static('/index.html'), '/_static/index.html', 'Basic local static path with leading slash')
  assertEquals(arc.http.helpers.static('index.html'), '/_static/index.html', 'Basic local static path (legacy)')

  Deno.env.set('NODE_ENV','testing')
  assertEquals(arc.static('index.html'), '/_static/index.html', 'Basic local static path (env=testing)')

  Deno.env.set('NODE_ENV','staging')
  assertEquals(arc.static('index.html'), '/_static/index.html', 'Always use /_static')

  Deno.env.delete('NODE_ENV') // Run it "locally"
  Deno.env.set('ARC_STATIC_PREFIX', 'foo')
  assertEquals(arc.static('index.html'), '/_static/index.html', 'Basic local static path unaffected by ARC_STATIC_PREFIX env var')
  Deno.env.delete('ARC_STATIC_PREFIX')

  Deno.env.set('ARC_STATIC_FOLDER', 'foo')
  assertEquals(arc.static('index.html'), '/_static/index.html', 'Basic local static path unaffected by ARC_STATIC_FOLDER env var')
  resetEnv()
})

Deno.test('Clean up env', async () => {
  //t.plan(1)
  Deno.env.set('AWS_REGION', origRegion)
  Deno.env.set('NODE_ENV', 'testing')
  await Deno.chdir(origCwd)
  await Deno.remove(tmp, { recursive: true })
  assertEquals(await exists(tmp), false, 'Mocks cleaned up')
})
