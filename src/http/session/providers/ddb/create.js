import ShortUniqueId from 'https://cdn.jsdelivr.net/npm/short-unique-id@latest/short_uuid/mod.ts'
import week from './_week-from-now.js'
import dynamo from '../../../../tables/dynamo.js'
import { CSRF } from 'https://deno.land/x/drash_middleware@v0.7.6/csrf/mod.ts'
const csrf = CSRF()
import * as parallel from 'https://deno.land/x/run_exclusive/mod.ts'

export default function _create (name, payload, callback) {
  parallel.build([
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
    dynamo.session(function _gotDB (err, db) {
      if (err) callback(err)
      else {
        db.put({
          TableName: name,
          Item: session
        },
        function _create (err) {
          if (err) callback(err)
          else callback(null, session)
        })
      }
    })
  })
}
