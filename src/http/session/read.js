import jwe from './providers/jwe.js'
import ddb from './providers/ddb/index.js'

const env = Deno.env.toObject()

export default function read (request, callback) {

  if (env.SESSION_TABLE_NAME === 'jwe')
    return jwe.read(request, callback)

  return ddb.read(request, callback)
}
