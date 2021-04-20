/* eslint global-require: "off" */
import { ServerRequest } from 'https://deno.land/std@0.93.0/http/server.ts'
import { SNS } from 'https://deno.land/x/aws_sdk@v3.13.0.0/client-sns/mod.ts'
import { Buffer } from 'https://deno.land/std@0.93.0/node/buffer.ts'

let snsClient = new SNS
let ledger = {}

// priv publish
// blindly publishes to sns topic json stringified record
// throws if fails so lambda errors are noticible
function __publish (arn, payload, callback) {
  console.log('Publishing SNS', JSON.stringify({ arn, payload }))
  snsClient.publish({
    TopicArn: arn,
    Message: JSON.stringify(payload)
  },
  function _published (err, result) {
    if (err) throw err
    callback(null, result)
  })
}

/**
 * invoke an event lambda by name
 *
 * usage
 *
 *   import arc from '@smallwins/arc-prototype'
 *
 *   arc.events.publish({
 *     name: 'eventname',
 *     payload: {hello: 'world'},
 *   }, console.log)
 *
 * this will invoke appname-staging-eventname (or appname-production-eventname)
 *
 * you can invoke events for other arc apps in the same region by overriding appname with app param like so:
 *
 *   arc.events.publish({
 *     app: 'otherappname',
 *     name: 'eventname',
 *     payload: {hello: 'world2'},
 *   }, console.log)
 */
export default function _publish (params, callback) {
  if (!params.name)
    throw ReferenceError('missing params.name')

  if (!params.payload)
    throw ReferenceError('missing params.payload')

  let promise
  if (!callback) {
    promise = new Promise((resolve, reject) => {
      callback = function errback (err, result) {
        err ? reject(err) : resolve(result)
      }
    })
  }

  let isLocal = env.NODE_ENV === 'testing' || env.ARC_LOCAL
  let exec = isLocal ? _local : _live
  exec(params, callback)
  return promise
}

function _live (params, callback) {
  let { name, payload } = params
  let arn = ledger[name]

  if (arn) {
    __publish(ledger[name], payload, callback)
  }
  else {
    let override = params.app
    let eventName = `${override ? params.app : env.ARC_APP_NAME}-${env.NODE_ENV}-${name}`
    _scan({ eventName }, function _scan (err, found) {
      if (err) throw err
      // cache the arn here
      ledger[name] = found
      // and continue
      __publish(ledger[name], payload, callback)
    })
  }
}

function _local (params, callback) {
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

function _scan ({ eventName }, callback) {
  let snsClient = new SNS()
  ;(function __scanner (params = {}, callback) {
    snsClient.listTopics(params, function _listTopics (err, results) {
      if (err) throw err
      let found = results.Topics.find(t => {
        let bits = t.TopicArn.split(':')
        let it = bits[bits.length - 1]
        return it === eventName
      })
      if (found) {
        callback(null, found.TopicArn)
      }
      else if (results.NextToken) {
        setTimeout(() => {
          // 30tps on sns.listTopics, so let's give just a bit of buffer
          __scanner({ NextToken: results.NextToken }, callback)
        }, 50)
      }
      else {
        callback(Error(`topic ${eventName} not found`))
      }
    })
  })({}, callback)
}
