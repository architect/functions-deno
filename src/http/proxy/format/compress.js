import { brotliCompress } from './deps.ts'
import { brotliDecompress } from './deps.ts'
import { gzipDecode, gzipEncode } from './deps.ts'
import { deflate, inflate } from './deps.ts'
import { Buffer } from './deps.ts'



function compressor (direction, type, data) {
  const decoder = new TextDecoder()
  let compress = direction === 'compress'

  if (compress && ( !(data instanceof Uint8Array) && !(data instanceof Buffer))) {
    const encoder = new TextEncoder()
    data = encoder.encode(data)
  }

  let exec = {
    gzip: compress ? gzipEncode : gzipDecode,
    br: compress ? brotliCompress : brotliDecompress,
    deflate: compress ? deflate : inflate
  }
  if (!exec[type]) throw ReferenceError('Invalid compression type specified, must be gzip, br, or deflate')

  if (!compress) {
    return decoder.decode(exec[type](data))
  }
  else {
    return Buffer.from(exec[type](data))
  }

}

export const compress = compressor.bind({}, 'compress')
export const decompress = compressor.bind({}, 'decompress')

