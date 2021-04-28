import { compress as brotliCompress } from 'https://deno.land/x/brotli/mod.ts'
import { decompress as brotliDecompress } from 'https://deno.land/x/brotli/mod.ts'
import {
  gzipDecode,
  gzipEncode,
} from 'https://github.com/manyuanrong/wasm_gzip/raw/master/mod.ts'
import {
  deflate,
  inflate,
} from 'https://deno.land/x/compress@v0.3.8/mod.ts'



function compressor (direction, type, data) {
  const decoder = new TextDecoder()
  let compress = direction === 'compress'

  if(compress) {
    const encoder = new TextEncoder()
    data = encoder.encode(data)
  }

  let exec = {
    gzip: compress ? gzipEncode : gzipDecode,
    br: compress ? brotliCompress : brotliDecompress,
    deflate: compress ? deflate : inflate
  }
  if (!exec[type]) throw ReferenceError('Invalid compression type specified, must be gzip, br, or deflate')
  
  if(!compress) {
    let buffer = exec[type](data)
    return decoder.decode(buffer)
  } else {
    return exec[type](data)
  }
  
}

export const compress = compressor.bind({}, 'compress')
export const decompress = compressor.bind({}, 'decompress')

