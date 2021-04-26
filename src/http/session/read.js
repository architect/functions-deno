import jwe from './providers/jwe.js'
import ddb from './providers/ddb/index.js'

export default function read (request, callback) {
  const env = Deno.env.toObject()
 
  if (env.SESSION_TABLE_NAME === 'jwe')
    return jwe.read(request, callback)

  return ddb.read(request, callback)
}
