import sandbox from './publish-sandbox.js'
import queue from './publish-queue.js'

/**
 * invoke a queue lambda by sqs queue name
 */
export default function publish (params, callback) {

  if (!params.name)
    throw ReferenceError('missing params.name')

  if (!params.payload)
    throw ReferenceError('missing params.payload')

  let promise
  if (!callback) {
    promise = new Promise((resolve, reject) => {
      callback = function errback (err, result) {
        err ? reject(err) : resolve(result)
      }
    })
  }

  let isLocal = Deno.env.get('NODE_ENV') === 'testing' || Deno.env.get('ARC_LOCAL')
  let exec = isLocal ? sandbox : queue
  exec(params, callback)
  return promise
}
