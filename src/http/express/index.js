/*
import aws from 'https://cdn.skypack.dev/@vendia/serverless-express'

const env = Deno.env.toObject()

export default function unexpress (app) {
  // TodoDeno - struggled to refactor this - @vendia/serverless-express - caused Error: [Package Error] "punycode" does not exist. (Imported by "@vendia/serverless-express").

  let server = aws.createServer(app)
  return function http (event, context, callback) {
    if (env.NODE_ENV === 'testing' || env.ARC_LOCAL) {
      return aws.proxy(server, event, context, 'CALLBACK', callback)
    }
    else {
      return aws.proxy(server, event, context)
    }
  }
  return false

}
*/

// temp function for eslint
export default function unexpress (app) {
  console.log(app)
  return false
}
