import {dotEnvConfig} from '../../../deps.ts'
dotEnvConfig({ export: true })

import { sinon } from '../../../deps.ts'
import { assert, AssertionError } from '../../../deps.ts'

import arc from '../../../../src/index.js'

Deno.test({
  name: 'events.subscribe should invoke provided handler for each SNS event Record', 
  fn: () => {
    //t.plan(2)
    const fake = sinon.fake.yields()
    const handler = arc.events.subscribe(fake)
    handler({
      Records: [ { Sns: { Message: '{"hey":"there"}' } }, { Sns: { Message: '{"sup":"bud"}' } } ]
    }, {}, function (err) {
      if (err) throw new AssertionError(err)
      else {
        assert(fake.calledWith({ hey: 'there' }), 'subscribe handler called with first SNS record')
        assert(fake.calledWith({ sup: 'bud' }), 'subscribe handler called with second SNS record')
      }
    })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'events.subscribe should invoke provided handler for each SNS event Record when handler is async', 
  fn: async () => {
    //t.plan(2)
    const fake = sinon.fake()
    const handler = arc.events.subscribe(async function (json) {
      await fake(json)
    })
    await handler({
      Records: [ { Sns: { Message: '{"hey":"there"}' } }, { Sns: { Message: '{"sup":"bud"}' } } ]
    })
    assert(fake.calledWith({ hey: 'there' }), 'subscribe handler called with first SNS record')
    assert(fake.calledWith({ sup: 'bud' }), 'subscribe handler called with second SNS record')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'events.subscribe should fall back to an empty event if one is not provided', 
  fn: () => {
    //t.plan(1)
    const fake = sinon.fake.yields()
    const handler = arc.events.subscribe(fake)
    handler(null, {}, function (err) {
      if (err) throw new AssertionError(err)
      else {
        assert(fake.calledWith({}), 'subscribe handler called with empty SNS record')
      }
    })
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'events.subscribe should fall back to an empty event if one is not provided (async)', 
  fn: async () => {
    const fake = sinon.fake()
    const handler = arc.events.subscribe(async function (json) {
      await fake(json)
    })
    await handler()
    assert(fake.calledWith({}), 'subscribe handler called with empty SNS record')
  },
  sanitizeResources: false,
  sanitizeOps: false
})