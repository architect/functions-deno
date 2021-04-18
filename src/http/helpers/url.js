/**
 * no magic url helper
 *
 * given a path / returns
 *
 * - / if NODE_ENV === testing
 * - /staging if NODE_ENV === staging
 * - /production if NODE_ENV === production
 */

const env = Deno.env.toObject();

export default function url (url) {
  let staging = env.NODE_ENV === 'staging'
  let production = env.NODE_ENV === 'production'
  if (!env.ARC_LOCAL && (staging || production))
    return `/${env.NODE_ENV}${url}`
  return url // fallthru for NODE_ENV=testing
}
