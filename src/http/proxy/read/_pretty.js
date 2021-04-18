import { S3 } from 'https://deno.land/x/aws_sdk@v3.13.0.0/client-s3/mod.ts'
import { existsSync } from "https://deno.land/std@0.93.0/fs/mod.ts"
import { join } from "https://deno.land/std@0.93.0/path/mod.ts"
import { httpError } from '../../errors/index.js'

/**
 * Peek into a dir without a trailing slash to see if it's got an index.html file
 *   If not, look for a custom 404.html
 *   Finally, return the default 404
 */

export default async function pretty (params) {
  let { Bucket, Key, assets, headers, isFolder, prefix } = params
  let { ARC_LOCAL, ARC_SANDBOX_PATH_TO_STATIC, NODE_ENV } = Deno.env.toObject()
  let local = NODE_ENV === 'testing' || ARC_LOCAL
  let s3Client = new S3

  function getKey (Key) {
    let lookup = Key.replace(prefix + '/', '')
    if (assets && assets[lookup]) {
      Key = assets[lookup]
      Key = prefix ? `${prefix}/${Key}` : Key
    }
    return Key
  }

  // eslint-disable-next-line
  async function getLocal (file) {
    let basepath = ARC_SANDBOX_PATH_TO_STATIC
    if (!file.startsWith(basepath)) {
      file = join(basepath, file)
    }
    if (!existsSync(file)) {
      let err = ReferenceError(`NoSuchKey: ${Key} not found`)
      err.name = 'NoSuchKey'
      throw err
    }
    else return {
      Body: Deno.readFileSync(file)
    }
  }

  async function getS3 (Key) {
    return await s3Client.getObject({ Bucket, Key }).promise()
  }

  async function get (file) {
    let getter = local ? getLocal : getS3
    try {
      return await getter(file)
    }
    catch (err) {
      if (err.name === 'NoSuchKey') {
        err.statusCode = 404
        return err
      }
      else {
        err.statusCode = 500
        return err
      }
    }
  }

  /**
   * Enable pretty urls
   *   Peek into a dir without trailing slash to see if it contains index.html
   */
  if (isFolder && !Key.endsWith('/')) {
    let peek = getKey(`${Key}/index.html`)
    let result = await get(peek)
    if (result.Body) {
      let body = result.Body.toString()
      return { headers, statusCode: 200, body }
    }
  }

  /**
   * Enable custom 404s
   *   Check to see if user defined a custom 404 page
   */
  let notFound = getKey(`404.html`)
  let result = await get(notFound)
  if (result.Body) {
    let body = result.Body.toString()
    return {
      headers: {
        'Content-Type': 'text/html; charset=utf8;',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0'
      },
      statusCode: 404,
      body
    }
  }
  else {
    let err = result
    let { statusCode } = err
    let title = err.name
    let message = `
      ${err.message} <pre><b>${Key}</b></pre><br>
      <pre>${err.stack}</pre>
    `
    return httpError({ statusCode, title, message })
  }
}
