//import aws from 'https://cdn.skypack.dev/@vendia/serverless-express'

const env = Deno.env.toObject();

export default function unexpress (app) {
  /* let server = aws.createServer(app)
  return function http (event, context, callback) {
    if (env.NODE_ENV === 'testing' || env.ARC_LOCAL) {
      return aws.proxy(server, event, context, 'CALLBACK', callback)
    }
    else {
      return aws.proxy(server, event, context)
    }
  } */
  return false
}
