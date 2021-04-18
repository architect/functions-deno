import { ServerRequest } from "https://deno.land/std@0.93.0/http/server.ts";

const env = Deno.env.toObject();
const decoder = new TextDecoder();

export default function sandbox (params, callback) {
  let port = env.ARC_EVENTS_PORT || 3334
  let req = new ServerRequest({
    method: 'POST',
    port,
    path: '/queues',
  },
  function done (res) {
    let data = []
    res.resume()
    res.on('data', chunk => data.push(chunk))
    res.on('end', () => {
      let body = decoder.decode(data)
      let code = `${res.statusCode}`
      if (!code.startsWith(2)) callback(Error(`${body} (${code})`))
      else callback(null, body)
    })
  }) 
  req.write(JSON.stringify(params))
  req.end('\n')
}
