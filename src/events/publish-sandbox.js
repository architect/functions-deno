import { ServerRequest } from 'https://deno.land/std@0.93.0/http/server.ts'
import { Buffer } from 'https://deno.land/std@0.93.0/node/buffer.ts'
const env = Deno.env.toObject()

export default function publishLocal (params, callback) {
  let port = env.ARC_EVENTS_PORT || 3334
  let req = new ServerRequest({
    method: 'POST',
    port,
    path: '/events',
  },
  function done (res) {
    let data = []
    res.resume()
    res.on('data', chunk => data.push(chunk))
    res.on('end', () => {
      let body = Buffer.concat(data).toString()
      let code = `${res.statusCode}`
      if (!code.startsWith(2)) callback(Error(`${body} (${code})`))
      else callback(null, body)
    })
  })
  req.write(JSON.stringify(params))
  req.end('\n')
}
