import { SQSClient } from '../deps.ts'
import lookup from '../discovery/index.js'
let ledger = {}

export default function live ({ name, payload, delaySeconds, groupID }, callback) {

  function publish (QueueUrl, payload, callback) {
    let sqsClient = new SQSClient
    let params = {
      QueueUrl,
      DelaySeconds: delaySeconds || 0,
      MessageBody: JSON.stringify(payload)
    }
    if (QueueUrl.endsWith('.fifo')) {
      params.MessageGroupId = groupID || name
    }
    sqsClient.sendMessage(params, callback)
  }

  let arn = ledger[name]
  if (arn) {
    publish(ledger[name], payload, callback)
  }
  else {
    lookup.queues(function done (err, found) {
      if (err) callback(err)
      else if (!found[name]) {
        callback(ReferenceError(`${name} not found`))
      }
      else {
        ledger = found
        publish(ledger[name], payload, callback)
      }
    })
  }
}
