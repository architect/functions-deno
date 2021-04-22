import dynamo from './dynamo.js'
import promisify from './promisify-object.js'
import parallel from 'https://cdn.skypack.dev/pin/run-parallel@v1.2.0-k69TQdgU7luJsLHnLpnN/mode=imports/optimized/run-parallel.js'
import { marshall, unmarshall } from 'https://deno.land/x/aws_sdk@v3.13.0.0/util-dynamodb/mod.ts'
/**
 * returns a data client
 */
export default function sandbox (callback) {
  parallel([
    dynamo.db,
    dynamo.doc
  ],
  function _done (err, results) {
    if (err) callback(err)
    else {
      let db = results[0]
      let doc = results[1]
      db.listTables({}, function listed (err, result) {
        if (err) callback(err)
        else {
          let reduce = (a, b) => Object.assign({}, a, b)
          // TODO: no such table name as 'arc-sessions' (they would all be in the form appname-env-tablename, so the below arc-sessions conditional is not providing value
          let dontcare = tbl => tbl != 'arc-sessions' && tbl.includes('-production-') === false
          let tables = result.TableNames.filter(dontcare)
          let data = tables.map(function fmt (tbl) {
            let parts = tbl.split('-staging-')
            let app = parts.shift()
            let name = parts.join('')
            return client(app)(name)
          }).reduce(reduce, {})

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
            return tables.reduce(function visit (result, tbl) {
              let parts = tbl.split('-staging-')
              let app = parts.shift()
              let name = parts.join('')
              result[name] = `${app}-staging-${name}`
              return result
            }, {})
          }

          let _name = name => tables.filter(t => RegExp(`^.*${name}$`).test(t))[0]
          data.name = _name
          data._name = _name

          callback(null, data)
        }
      })

      function client (appname) {
        return function (tablename) {
          let name = nom => `${appname}-staging-${nom}`
          let TableName = name(tablename)
          let client = {
            async delete (key, callback) {
              let params = {}
              params.TableName = TableName
              params.Key = marshall(key)
              
              try {
                const { Item } = await doc.deleteItem(params)
                callback(null)
              } catch(err) {
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
                if(typeof Item !== 'undefined') {
                  _item = unmarshall(Item)
                } 
                callback(null, _item)
              } catch(err) {
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
              } catch(err) {
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
          }
          let result = {}
          result[tablename] = promisify(client)
          return result
        }
      }
    }
  })

}
