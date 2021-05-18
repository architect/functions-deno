import { SNS } from './deps.ts'
import lookup from '../discovery/index.js'
let ledger = {}

export default function live ({ name, payload }, callback) {

  function publish (arn, payload, callback) {
    console.log('sns.publish', JSON.stringify({ arn, payload }))
    let snsClient = new SNS
    snsClient.publish({
      TopicArn: arn,
      Message: JSON.stringify(payload)
    }, callback)
  }

  let arn = ledger[name]
  if (arn) {
    publish(ledger[name], payload, callback)
  }
  else {
    lookup.events(function done (err, found) {
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
