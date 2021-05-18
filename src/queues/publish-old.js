import { ServerRequest } from './deps.ts'
import { waterfall } from './deps.ts'
import { SQS } from './deps.ts'
import { Buffer } from './deps.ts'

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
  let name = `${Deno.env.get('ARC_APP_NAME')}-${Deno.env.get('NODE_ENV')}-${params.name}`
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
  let local = Deno.env.get('NODE_ENV') === 'testing' || Deno.env.get('ARC_LOCAL')
  if (local) {
    let port = Deno.env.get('ARC_EVENTS_PORT') || 3334

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
        let body = Buffer.concat(data).toString()
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
