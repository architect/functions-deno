//std lib
export * as path from "https://deno.land/std@0.95.0/path/mod.ts"
export {
  equal,
  assert,
  assertExists,
  assertArrayIncludes,
  assertEquals,
  assertNotEquals,
  assertThrowsAsync,
  AssertionError,
  assertThrows
} from "https://deno.land/std@0.95.0/testing/asserts.ts"
export { Buffer } from 'https://deno.land/std@0.95.0/node/buffer.ts'
export { exists, existsSync} from 'https://deno.land/std@0.95.0/fs/mod.ts'
export { createRequire } from "https://deno.land/std@0.95.0/node/module.ts";
export * as crypto from 'https://deno.land/std@0.95.0/node/crypto.ts'

//3rd-party
export { config as dotEnvConfig } from "https://deno.land/x/dotenv@v2.0.0/mod.ts"
export * as sinon from 'https://cdn.skypack.dev/sinon'
export { compress as brotliCompress } from 'https://deno.land/x/brotli/mod.ts'
export { decompress as brotliDecompress } from 'https://deno.land/x/brotli/mod.ts'
export { gzipDecode, gzipEncode } from 'https://github.com/manyuanrong/wasm_gzip/raw/master/mod.ts'
export { deflate, inflate } from 'https://deno.land/x/compress@v0.3.8/mod.ts'
//export * as mockfs from 'https://dev.jspm.io/mock-fs' 
//export * as proxyquire from 'https://dev.jspm.io/proxyquire'

//project-specific
export { DenoSandbox, read } from './deno-sandbox.js';