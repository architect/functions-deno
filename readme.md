[<img src="https://s3-us-west-2.amazonaws.com/arc.codes/architect-logo-500b@2x.png" width=500>](https://www.npmjs.com/package/@architect/functions)

## Deno @architect-functions

> Runtime helper library for serverless apps built with [Architect][Deno]

## Example

# Http async

```javascript
import arcHttpAsync from 'https://raw.githubusercontent.com/hicksy/functions/architect-functions-deno/src/http/async/index.js'

export const handler = arcHttpAsync( (event: Record<string, unknown>) => {
    console.log(JSON.stringify(event, null, 2));

    return {
        location: "/"
    }
});

```
# Auth
- I've updated the arc-example-login-flow example to the Deno runtime, making use of this WIP module. 
- Provides example demonstrating `jwt` tokens etc
https://github.com/hicksy/functions/tree/architect-functions-deno


# Test

Integration only:
`deno test --allow-run --allow-read --allow-env --allow-write --allow-net --unstable ./test/integration`

Unit only:
`deno test --allow-run --allow-read --allow-env --allow-write --allow-net --unstable ./test/unit`


# Notes

- `Deno.run` use to launch a sub process of `arc sandbox` within the mock path - not possible to directly call sandbox through JS 

- Having to use `sanitizeResources: false,sanitizeOps: false` on `Deno.test` quite a bit - does this suggest a problem in the codebase / the tests / or is this safe?

## Todo
- unexpress (src/https/express)
- JWE - *_Session tokens incompatible with node/ruby/python_* - currently there's no availaility of a library that uses the A128GCM algorithm. Possible that if [webcrypto APIs are implemented in Deno](https://github.com/denoland/deno/issues/1891) then [jose](https://github.com/panva/jose) would be available. 
- no zlib. `compress.js` uses `gzipDecode/ gzipEncode`, `deflate/inflate` and `compress/decompress` (brotli) instead

Test with suffix `.test-fail.js` are skipped, we need to refactor based on:
- No `mockfs` equivalant and can't use Skypack / jspm,
- No `proxyquire`

