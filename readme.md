[<img src="https://s3-us-west-2.amazonaws.com/arc.codes/architect-logo-500b@2x.png" width=500>](https://www.npmjs.com/package/@architect/functions)

## Deno @architect-functions

> Runtime helper library for serverless apps built with [Architect][Deno]

# WIP Notes

- Tests have not been ported. 

- Some functions have been difficult to modify (due to my lack of understanding)
    - DynamoDB doesn't return Doc (I'm unclear on how that works in the aws-sdk v3 api) [/src/tables/dynamo.js]
    - [/src/http/express/index.js] - I've had to comppletely comment this one out. The 3rd party module `@vendia/serverless-express` causes an error (Error: [Package Error] "punycode" does not exist. (Imported by "@vendia/serverless-express").)


## Example

# Http async

```

import arcHttpAsync from '/Users/martinhicks/Projects/architect-functions-deno/src/http/async/index.js'

export const handler = arcHttpAsync( (event: Record<string, unknown>) => {
	console.log(JSON.stringify(event, null, 2));

});

```