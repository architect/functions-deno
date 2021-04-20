import { ServerRequest } from 'https://deno.land/std@0.93.0/http/server.ts'
import { Buffer } from 'https://deno.land/std@0.93.0/node/buffer.ts'

const env = Deno.env.toObject()

export default function send ({ id, payload }, callback) {
  let port = env.PORT || 3333
  let body = JSON.stringify({ id, payload })
  let req = new ServerRequest({
    method: 'POST',
    port,
    path: '/__arc',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body)
    }
  })
  req.on('error', callback)
  req.on('close', () => callback())
  req.write(body)
  req.end()
}
