import { existsSync } from 'https://deno.land/std@0.93.0/fs/mod.ts'
import { join } from 'https://deno.land/std@0.93.0/path/mod.ts'

const env = Deno.env.toObject()

/**
 * Architect static asset helper
 * - Returns the live asset path and filename
 *
 * In order to keep this method sync, it does not use reflection to get fingerprint status
 * - Not checking @static fingerprint true (which we used to read from the .arc file) is possibly dangerous, so ensure asset path is valid
 * - ? TODO: add fingerprint state to env vars in Arc 6 to restore config safety?
 * @param {string} path - the path to the asset (eg. /index.js)
 * @returns {string} path - the resolved asset path (eg. /_static/index-xxx.js)
 */
export default function _static (asset, options = {}) {
  let key = asset[0] === '/' ? asset.substring(1) : asset
  let isIndex = asset === '/'
  let manifest = join(Deno.cwd(), 'node_modules', '@architect', 'shared', 'static.json')
  let exists = existsSync(manifest)
  let local = env.NODE_ENV === 'testing' || env.ARC_LOCAL
  let stagePath = options.stagePath && !local ? '/' + env.NODE_ENV : ''
  let path = `${stagePath}/_static`
  if (!local && exists && !isIndex) {
    let read = p => Deno.readFileSync(p).toString()
    let pkg = JSON.parse(read(manifest))
    let asset = pkg[key]
    if (!asset)
      throw ReferenceError(`Could not find asset in static.json (asset fingerprint manifest): ${key}`)
    return `${path}/${asset}`
  }
  return `${path}/${isIndex ? '' : key}`
}
