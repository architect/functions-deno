import {dotEnvConfig} from '../../../deps.ts'
dotEnvConfig({ export: true })

import { assertThrowsAsync } from "../../../deps.ts"
import arc from '../../../../src/index.js'

Deno.test({
    name: 'events.publish should throw if there is no parameter name', 
    fn: async () => {
        //t.plan(1)
        await assertThrowsAsync(() => { arc.events.publish({}) }, Error, 'missing params.name')
    },
    sanitizeResources: false,
    sanitizeOps: false
})

Deno.test({
    name: 'events.publish should throw if there is no parameter payload', 
    fn: async () => {
        //t.plan(1)
        await assertThrowsAsync(() => { arc.events.publish({ name: 'batman' })}, Error, 'missing params.payload')
    },
    sanitizeResources: false,
    sanitizeOps: false
})
