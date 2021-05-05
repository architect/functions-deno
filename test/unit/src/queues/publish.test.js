import publish from '../../../../src/queues/publish.js'
import { assertThrows } from '../../../deps.ts'

Deno.test({
  name: 'queues.publish should throw if there is no parameter name', 
  fn: () => {
    //t.plan(1)
    assertThrows(() => publish({}), ReferenceError, 'missing params.name', 'throws missing name parameter exception')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'queues.publish should throw if there is no parameter payload', 
  fn: () => {
    //t.plan(1)
    assertThrows(() => publish({ name: 'batman' }), ReferenceError, 'missing params.payload', 'throws missing payload parameter exception')
  },
  sanitizeResources: false,
  sanitizeOps: false
})
