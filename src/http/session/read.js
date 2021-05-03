import jwe from './providers/jwe.js'
import ddb from './providers/ddb/index.js'

export default function read (request, callback) {

  if (Deno.env.get('SESSION_TABLE_NAME') === 'jwe' || Deno.env.get('SESSION_TABLE_NAME') === undefined)
    return jwe.read(request, callback)

  return ddb.read(request, callback)
}
