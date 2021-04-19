import sandbox from './publish-sandbox.js'
import queue from './publish-queue.js'

const env = Deno.env.toObject()

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

  let isLocal = env.NODE_ENV === 'testing' || env.ARC_LOCAL
  let exec = isLocal ? sandbox : queue
  exec(params, callback)
  return promise
}
