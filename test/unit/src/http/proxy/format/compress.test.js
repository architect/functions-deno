import * as sut from '../../../../../../src/http/proxy/format/compress.js'
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
import {
  assert,
  AssertionError,
  assertEquals,
  assertThrows,
  assertNotEquals
} from "https://deno.land/std@0.93.0/testing/asserts.ts"
import { Buffer } from 'https://deno.land/std@0.93.0/node/buffer.ts'

let data = 'this is fine'

Deno.test({
  name: 'Set up env', 
  fn: () => {
    //t.plan(3)
    assert(sut, 'Loaded compression util')
    assert(sut.compress, 'Compression util has compress method')
    assert(sut.decompress, 'Compression util has decompress method')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Fails with wrong type', 
  fn: () => {
    //t.plan(1)
    let { compress } = sut
    assertThrows(() => {
      compress('zip', data)
    }, Error, 'Invalid compression type specified, must be gzip, br, or deflate')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Compression', 
  fn: () => {
    //t.plan(3)
    let { compress } = sut
    let gzip = compress('gzip', data)
    let br = compress('br', data)
    let deflate = compress('deflate', data)
    assertEquals(Buffer.from(gzipDecode(gzip)).toString(), data, 'gzip returned correct data')
    assertEquals(Buffer.from(brotliDecompress(br)).toString(), data, 'br returned correct data')
    assertEquals(Buffer.from(inflate(deflate)).toString(), data, 'deflate returned correct data')
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Decompression', 
  fn: () => {
    //t.plan(3)

    const encoder = new TextEncoder()
    let dataBuffer = encoder.encode(data)

    let { decompress } = sut
    let gzip = decompress('gzip', gzipEncode(dataBuffer))
    let br = decompress('br', brotliCompress(dataBuffer))
    let deflated = decompress('deflate', deflate(dataBuffer))
    assertEquals((gzip).toString(), data, 'gzip returned correct data')
    assertEquals((br).toString(), data, 'br returned correct data')
    assertEquals((deflated).toString(), data, 'deflate returned correct data')
  },
  sanitizeResources: false,
  sanitizeOps: false
})
