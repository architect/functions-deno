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
  let compress = direction === 'compress'
  let exec = {
    gzip: compress ? gzipEncode : gzipDecode,
    br: compress ? brotliCompress : brotliDecompress,
    deflate: compress ? deflate : inflate
  }
  if (!exec[type]) throw ReferenceError('Invalid compression type specified, must be gzip, br, or deflate')

  return exec[type](data)
}

export const compress = compressor.bind({}, 'compress')
export const decompress = compressor.bind({}, 'decompress')

