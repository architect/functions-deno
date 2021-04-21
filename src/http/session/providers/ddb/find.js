import dynamo from '../../../../tables/dynamo.js'
import create from './create.js'
import { marshall, unmarshall } from 'https://deno.land/x/aws_sdk@v3.13.0.0/util-dynamodb/mod.ts'

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
