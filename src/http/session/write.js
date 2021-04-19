import jwe from './providers/jwe.js'
import ddb from './providers/ddb/index.js'

const env = Deno.env.toObject()

export default function write (params, callback) {

  if (env.SESSION_TABLE_NAME === 'jwe')
    return jwe.write(params, callback)

  return ddb.write(params, callback)
}
