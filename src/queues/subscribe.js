import * as parallel from 'https://deno.land/x/run_exclusive/mod.ts'
/**
 * // Exmaple usage:
 *
 * var arc = require('@architect/functions')
 *
 * function signup(record, callback) {
 *   console.log(record)
 *   callback()
 * }
 *
 * // or
 * async function signup(event) {
 *   console.log(event)
 *   return true
 * }
 *
 * exports.handler = arc.queues.subscribe(signup)
 *
 */
export default function _subscribe (fn) {
  if (fn.constructor.name === 'AsyncFunction') {
    return async function lambda (event) {
      return await Promise.all(event.Records.map(async record => {
        try {
          let result = JSON.parse(record.body)
          return await fn(result)
        }
        catch (e) {
          console.log('Queue subscribe error:', e)
          throw e
        }
      }))
    }
  }
  else {
    return function _lambdaSignature (evt, ctx, callback) {
      // sqs triggers send batches of records
      // so we're going to create a handler for each one
      // and execute them in parallel
      parallel.build(evt.Records.map(function _iterator (record) {
        // for each record we construct a handler function that assumes body is JSON
        return function _actualHandler (callback) {
          try {
            fn(JSON.parse(record.body), callback)
          }
          catch (e) {
            callback(e)
          }
        }
      }), callback)
    }
  }
}
