import { ServerRequest } from './deps.ts'
import { Buffer } from './deps.ts'

export default function send ({ id, payload }, callback) {
  let port = Deno.env.get('PORT') || 3333
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
