@app
test-only

@aws
runtime deno
timeout 30

@http
get /http-session
get /http-async-session

@tables
arc-sessions
  _idx *String
  _ttl TTL
