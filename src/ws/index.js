import sandbox from './send-sandbox.js'
import run from './send.js'

const env = Deno.env.toObject()

/**
 * arc.ws.send
 *
 * publish web socket events
 *
 * @param {Object} params
 * @param {String} params.id - the ws connecton id (required)
 * @param {Object} params.payload - an event payload (required)
 * @param {Function} callback - a node style errback (optional)
 * @returns {Promise} - returned if no callback is supplied
 */
export default function send ({ id, payload }, callback) {

  // create a promise if no callback is defined
  let promise
  if (!callback) {
    promise = new Promise(function (res, rej) {
      callback = function (err, result) {
        err ? rej(err) : res(result)
      }
    })
  }

  let local = env.NODE_ENV === 'testing' || env.ARC_LOCAL
  let exec = local ? sandbox : run

  exec({
    id,
    payload
  }, callback)

  return promise
}
