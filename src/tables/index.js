import waterfall from 'https://cdn.skypack.dev/pin/run-waterfall@v1.1.7-6lUADtad6KJAms9NUvQ5/mode=imports,min/optimized/run-waterfall.js'
import old from './old.js'
import lookup from '../discovery/index.js'
import factory from './factory.js'
import sandbox from './sandbox.js'
import dynamo from './dynamo.js'

// cheap client cache
let client = false

/**
 * // example usage:
 * import arc from 'architect/functions'
 *
 * exports.handler = async function http(req) {
 *  let data = await arc.tables()
 *  await data.tacos.put({taco: 'pollo'})
 *  return {statusCode: 200}
 * }
 */
function tables (callback) {
  let promise
  if (!callback) {
    promise = new Promise(function ugh (res, rej) {
      callback = function errback (err, result) {
        if (err) rej(err)
        else res(result)
      }
    })
  }
  /**
   * Read Architect manifest if local / sandbox, otherwise use service reflection
   */
  let runningLocally = Deno.env.get('NODE_ENV') === 'testing'
  if (runningLocally) {
    sandbox(callback)
  }
  else if (client) {
    callback(null, client)
  }
  else {
    waterfall([
      lookup.tables,
      factory,
      function (created, callback) {
        client = created
        callback(null, client)
      }
    ], callback)
  }
  return promise
}

// Export directly for fast use
tables.doc = dynamo.direct.doc
tables.db = dynamo.direct.db

// Legacy compat methods
tables.insert = old.insert
tables.modify = old.modify
tables.update = old.update
tables.remove = old.remove
tables.destroy = old.destroy
tables.all = old.all
tables.save = old.save
tables.change = old.change

export default tables
