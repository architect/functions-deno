import { ServerRequest } from "https://deno.land/std@0.93.0/http/server.ts";

const env = Deno.env.toObject();
const decoder = new TextDecoder();

export default function send ({ id, payload }, callback) {
  let port = env.PORT || 3333
  let body = JSON.stringify({ id, payload })
  let req = new ServerRequest({
    method: 'POST',
    port,
    path: '/__arc',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': decoder.decode(body).length
    }
  })
  req.on('error', callback)
  req.on('close', () => callback())
  req.write(body)
  req.end()
}
