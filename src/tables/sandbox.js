import dynamo from './dynamo.js'
import promisify from './promisify-object.js'
import * as parallel from "https://deno.land/x/run_exclusive/mod.ts";

/**
 * returns a data client
 */
export default function sandbox (callback) {
  parallel.build([
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
            delete (key, callback) {
              let params = {}
              params.TableName = TableName
              params.Key = key
              doc.delete(params, callback)
            },
            get (key, callback) {
              let params = {}
              params.TableName = TableName
              params.Key = key
              doc.get(params, function _get (err, result) {
                if (err) callback(err)
                else callback(null, result.Item)
              })
            },
            put (item, callback) {
              let params = {}
              params.TableName = TableName
              params.Item = item
              doc.put(params, function _put (err) {
                if (err) callback(err)
                else callback(null, item)
              })
            },
            query (params, callback) {
              params.TableName = TableName
              doc.query(params, callback)
            },
            scan (params, callback) {
              params.TableName = TableName
              doc.scan(params, callback)
            },
            update (params, callback) {
              params.TableName = TableName
              doc.update(params, callback)
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
