import jwe from './providers/jwe.js'
import ddb from './providers/ddb/index.js'

export default function write (params, callback) {

  if (Deno.env.get('SESSION_TABLE_NAME') === 'jwe')
    return jwe.write(params, callback)

  return ddb.write(params, callback)
}
