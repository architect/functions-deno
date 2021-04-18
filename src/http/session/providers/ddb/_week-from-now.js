// epoch + one week IN SECONDS
// - Date.now() returns ms
// - DynamoDB TTL is in seconds
export default function _weekFromNow () {
  return (Date.now() / 1000) + 604800
}
