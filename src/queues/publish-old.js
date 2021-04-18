import { ServerRequest } from "https://deno.land/std@0.93.0/http/server.ts";
import waterfall from 'https://cdn.skypack.dev/pin/run-waterfall@v1.1.7-6lUADtad6KJAms9NUvQ5/mode=imports,min/optimized/run-waterfall.js'
import { SQS } from 'https://deno.land/x/aws_sdk@v3.13.0.0/client-sqs/mod.ts'

const env = Deno.env.toObject();
const decoder = new TextDecoder();
/**
 * invoke an sqs lambda by name
 *
 * usage
 *
 *   import arc from '@architect/functions'
 *
 *   arc.queues.publish({
 *     name: 'queue-name-here',
 *     payload: {hello: 'world'},
 *   }, console.log)
 *
 */
export default function _publish (params, callback) {

  // ensure required input
  if (!params.name)
    throw ReferenceError('missing params.name')
  if (!params.payload)
    throw ReferenceError('missing params.payload')

  // queue name normalized with appname and env
  let name = `${env.ARC_APP_NAME}-${env.NODE_ENV}-${params.name}`
  let payload = params.payload

  let promise
  if (!callback) {
    promise = new Promise((resolve, reject) => {
      callback = function errback (err, result) {
        err ? reject(err) : resolve(result)
      }
    })
  }

  // check if we're running locally
  let local = env.NODE_ENV === 'testing' || env.ARC_LOCAL
  if (local) {
    let port = env.ARC_EVENTS_PORT || 3334

    // if so send the mock request
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
  else {
    // otherwise attempt to sqs.sendMessage
    let sqsClient = new SQS
    waterfall([
      function reads (callback) {
        sqs.getQueueUrl({
          QueueName: name,
        }, callback)
      },
      function publishes (result, callback) {
        let QueueUrl = result.QueueUrl
        let DelaySeconds = params.delaySeconds || 0
        console.log('sqs.sendMessage', JSON.stringify({ QueueUrl, DelaySeconds, payload }))
        sqsClient.sendMessage({
          QueueUrl,
          DelaySeconds,
          MessageBody: JSON.stringify(payload)
        }, callback)
      }
    ],
    function _published (err, result) {
      if (err) throw err
      callback(null, result)
    })
  }
  return promise
}
