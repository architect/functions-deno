import readLocal from './_local.js'
import readS3 from './_s3.js'

export default function read () {
  let { ARC_LOCAL, NODE_ENV } = Deno.env.toObject()
  let local = NODE_ENV === 'testing' || ARC_LOCAL
  return local ? readLocal : readS3
}


