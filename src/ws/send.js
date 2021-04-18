import { ApiGatewayManagementApi } from 'https://deno.land/x/aws_sdk@v3.13.0.0/client-apigatewaymanagementapi/mod.ts'

const env = Deno.env.toObject();

export default function send ({ id, payload }, callback) {
  let endpoint
  let ARC_WSS_URL = env.ARC_WSS_URL
  if (!ARC_WSS_URL.startsWith('wss://')) {
    // This format of env was only alive for a few weeks, can prob safely retire by mid 2020
    endpoint = `https://${ARC_WSS_URL}/${env.NODE_ENV}`
  }
  else {
    endpoint = `https://${ARC_WSS_URL.replace('wss://', '')}`
  }
  let api = new ApiGatewayManagementApi({
    apiVersion: '2018-11-29',
    endpoint
  })
  api.postToConnection({
    ConnectionId: id,
    Data: JSON.stringify(payload)
  },
  function postToConnection (err) {
    if (err) callback(err)
    else callback()
  })
}
