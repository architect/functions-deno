@app
test-only

@aws
runtime deno

@http
get /http-session
get /http-async-session

@tables
arc-sessions
  _idx *String
  _ttl TTL
