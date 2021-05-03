import readLocal from './_local.js'
import readS3 from './_s3.js'

let { ARC_LOCAL, NODE_ENV } = Deno.env.toObject()
let local = NODE_ENV === 'testing' || ARC_LOCAL

const read = (local) ? readLocal : readS3

export default read
