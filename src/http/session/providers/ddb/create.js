import { ShortUniqueId } from '../../../../deps.ts'
import { parallel } from '../../../../deps.ts'
import { marshall } from '../../../../deps.ts'
import { CSRF } from '../../../../deps.ts'
const csrf = CSRF()

import week from './_week-from-now.js'
import dynamo from '../../../../tables/dynamo.js'

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
