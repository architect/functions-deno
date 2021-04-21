import ShortUniqueId from 'https://cdn.jsdelivr.net/npm/short-unique-id@latest/short_uuid/mod.ts'
import week from './_week-from-now.js'
import dynamo from '../../../../tables/dynamo.js'
import { CSRF } from 'https://deno.land/x/drash_middleware@v0.7.6/csrf/mod.ts'
const csrf = CSRF()
// import * as parallel from 'https://deno.land/x/run_exclusive/mod.ts'
import parallel from 'https://cdn.skypack.dev/pin/run-parallel@v1.2.0-k69TQdgU7luJsLHnLpnN/mode=imports/optimized/run-parallel.js'
import { marshall } from 'https://deno.land/x/aws_sdk@v3.13.0.0/util-dynamodb/mod.ts'

export default function _create (name, payload, callback) {
  parallel([
    function _key (callback) {

      const uid = new ShortUniqueId()
      const val = uid(18)
      callback(null, { _idx: val })

    },
    function _secret (callback) {
      callback(null, { _secret:  csrf.token })

    }
  ],
  function _put (err, results) {
    if (err) throw err
    results.push({ _ttl: week() })
    let keys = results.reduce((a, b) => Object.assign(a, b))
    let session = Object.assign(payload, keys)
    dynamo.session(async function _gotDB (err, db) {
      if (err) callback(err)
      else {

        let success = await db.putItem({
          TableName: name,
          Key: '_idx',
          Item: marshall(session)
        })

        if (!success) callback(err)
        else callback(null, session)

      }
    })
  })
}
