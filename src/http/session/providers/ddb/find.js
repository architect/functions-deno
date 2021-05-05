import { marshall, unmarshall } from '../../../../deps.ts'

import dynamo from '../../../../tables/dynamo.js'
import create from './create.js'

export default function _find (name, _idx, callback) {
  dynamo.session(function _gotDB (err, db) {
    if (err) callback(err)
    else {
      db.getItem({
        TableName: name,
        ConsistentRead: true,
        Key: marshall({ _idx })
      },
      function _get (err, data) {
        if (err) callback(err)
        else {
          let result = typeof data === 'undefined' ? false : unmarshall(data.Item)
          if (result && result._secret) {
            callback(null, result)
          }
          else {
            create(name, {}, callback)
          }
        }
      })
    }
  })
}
