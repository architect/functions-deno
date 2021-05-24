import {dotEnvConfig} from '../../../deps.ts'
dotEnvConfig({ export: true })
import { assertThrows } from '../../../deps.ts'

import arc from '../../../../src/index.js'

Deno.test({
  name: 'queues.publish should throw if there is no parameter name', 
  fn: () => {
    //t.plan(1)
    assertThrows(() => arc.queues.publish({}), ReferenceError, 'missing params.name', 'throws missing name parameter exception')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'queues.publish should throw if there is no parameter payload', 
  fn: () => {
    //t.plan(1)
    assertThrows(() => arc.queues.publish({ name: 'batman' }), ReferenceError, 'missing params.payload', 'throws missing payload parameter exception')
  },
  sanitizeResources: false,
  sanitizeOps: false
})
