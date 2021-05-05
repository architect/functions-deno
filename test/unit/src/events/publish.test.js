import { assertThrowsAsync } from "../../../deps.ts"
import publish from '../../../../src/events/publish.js'

Deno.test({
    name: 'events.publish should throw if there is no parameter name', 
    fn: async () => {
        //t.plan(1)
        await assertThrowsAsync(() => { publish({}) }, Error, 'missing params.name')
    },
    sanitizeResources: false,
    sanitizeOps: false
})

Deno.test({
    name: 'events.publish should throw if there is no parameter payload', 
    fn: async () => {
        //t.plan(1)
        await assertThrowsAsync(() => { publish({ name: 'batman' })}, Error, 'missing params.payload')
    },
    sanitizeResources: false,
    sanitizeOps: false
})
