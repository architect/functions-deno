/**
 * no magic url helper
 *
 * given a path / returns
 *
 * - / if NODE_ENV === testing
 * - /staging if NODE_ENV === staging
 * - /production if NODE_ENV === production
 */


export default function url (url) {
  let staging = Deno.env.get('NODE_ENV') === 'staging'
  let production = Deno.env.get('NODE_ENV') === 'production'
  if (!Deno.env.get('ARC_LOCAL') && (staging || production))
    return `/${Deno.env.get('NODE_ENV')}${url}`
  return url // fallthru for NODE_ENV=testing
}
