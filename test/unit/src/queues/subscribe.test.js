
import subscribe from '../../../../src/queues/subscribe.js'
//import mockSqsEvent from '../../../mock/mock-sqs-event.json' -- https://github.com/denoland/deno/issues/7623
const mockSqsEvent = JSON.parse(Deno.readTextFileSync('./test/mock/mock-sqs-event.json'));
import { sinon } from "../../../deps.ts"
import {
  assert,
  AssertionError,
  assertEquals,
  assertExists,
  assertNotEquals
} from "../../../deps.ts"

Deno.test({
  name: 'queues.subscribe calls handler', 
  fn: () => {
    //t.plan(1)

    let eventHandler = sinon.fake.yields()

    // get a lambda signature from the handler
    let handler = subscribe(eventHandler)

    // invoke the lambda handler with mock payloads
    let mockContext = {}
    handler(mockSqsEvent, mockContext, function _handler (err) {
      if (err) {
        AssertionError(err)
      }
      else {
        assert(eventHandler.calledOnce, 'event handler called once')
      }
    })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'queues.subscribe calls async handler', 
  fn: async () => {
    //t.plan(1)

    let fake = sinon.fake()

    // get a lambda signature from the handler
    // eslint-disable-next-line
    let handler = subscribe(async function (json) {
      fake(json)
    })

    // invoke the lambda handler with mock payloads
    await handler(mockSqsEvent)
    assert(fake.calledOnce, 'event handler called once')
  },
  sanitizeResources: false,
  sanitizeOps: false
})
