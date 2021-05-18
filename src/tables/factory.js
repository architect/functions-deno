import { parallel } from './deps.ts'
import { marshall, unmarshall } from './deps.ts'

import dynamo from './dynamo.js'
import promisify from './promisify-object.js'
/**
 * returns a data client
 */
export default function reflectFactory (tables, callback) {
  let { db, doc } = dynamo
  parallel({ db, doc }, function done (err, { db, doc }) {
    if (err) throw err
    else {

      let data = Object.keys(tables).reduce((client, tablename) => {
        client[tablename] = factory(tables[tablename])
        return client
      }, {})

      Object.defineProperty(data, '_db', {
        enumerable: false,
        value: db
      })

      Object.defineProperty(data, '_doc', {
        enumerable: false,
        value: doc
      })

      // async jic for later
      // eslint-disable-next-line
      data.reflect = async function reflect () {
        return tables
      }

      let _name = name => tables[name]
      data.name = _name
      data._name = _name

      function factory (TableName) {
        return promisify({
          async delete (key, callback) {
            let params = {}
            params.TableName = TableName
            params.Key = marshall({ key })
            try {
              await doc.deleteItem(params)
              callback(null)
            }
            catch (err) {
              callback(err)
            }
          },
          async get (key, callback) {
            let params = {}
            params.TableName = TableName
            params.Key = marshall(key)
            try {
              let _item
              const { Item }  = await doc.getItem(params)
              if (typeof Item !== 'undefined') {
                _item = unmarshall(Item)
              }
              callback(null, _item)
            }
            catch (err) {
              callback(err)
            }
          },
          async put (item, callback) {
            let params = {}
            params.TableName = TableName
            params.Item = marshall(item)

            try {
              await doc.putItem(params)
              callback(null, item)
            }
            catch (err) {
              callback(err)
            }

          },
          async query (params, callback) {
            params.ExpressionAttributeValues = marshall(params.ExpressionAttributeValues)
            params.TableName = TableName
            await doc.query(params, callback)
          },
          async scan (params, callback) {
            params.ExpressionAttributeValues = marshall(params.ExpressionAttributeValues)
            params.TableName = TableName
            await doc.scan(params, callback)
          },
          async update (params, callback) {
            params.Key = marshall(params.Key)
            params.ExpressionAttributeValues = marshall(params.ExpressionAttributeValues)
            params.TableName = TableName
            await doc.updateItem(params, callback)
          }
        })
      }

      callback(null, data)
    }
  })
}
