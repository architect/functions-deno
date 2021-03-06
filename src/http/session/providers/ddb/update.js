import { marshall } from '../../deps.ts'

import dynamo from '../../../../tables/dynamo.js'
import week from './_week-from-now.js'

export default function _update (name, payload, callback) {
  let _ttl = week()
  let session = Object.assign(payload, { _ttl })
  dynamo.session(function _gotDB (err, db) {
    if (err) callback(err)
    else {
      db.putItem({
        TableName: name,
        Item: marshall(session, { removeUndefinedValues: true })
      },
      function _create (err) {
        if (err) callback(err)
        else callback(null, session)
      })
    }
  })
}
