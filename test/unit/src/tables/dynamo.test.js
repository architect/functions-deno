import {
  assert,
  AssertionError,
  assertEquals,
  assertExists,
  assertNotEquals
} from "https://deno.land/std@0.93.0/testing/asserts.ts"

let dynamo
let env = Deno.env.get('NODE_ENV')
Deno.env.set('ARC_TABLES_PORT', '5000')

const DenoSandbox = (await import('../../../deno-sandbox.js')).DenoSandbox;
const sandbox = new DenoSandbox(false, Deno.cwd(), Deno.env.toObject())

function reset () {
  sandbox.stop()
  Deno.env.delete('ARC_TABLES_PORT')
  Deno.env.delete('AWS_REGION')
  Deno.env.delete('SESSION_TABLE_NAME')
  //delete require.cache[require.resolve(file)]
  dynamo = undefined

  if (Deno.env.get('ARC_TABLES_PORT')) AssertionError('Did not unset ARC_TABLES_PORT')
  if (Deno.env.get('AWS_REGION')) AssertionError('Did not unset AWS_REGION')
  if (Deno.env.get('SESSION_TABLE_NAME')) AssertionError('Did not unset SESSION_TABLE_NAME')
  //if (require.cache[require.resolve(file)]) AssertionError('Did not reset require cache')
  if (dynamo) AssertionError('Did not unset module')
}

Deno.test({
  name: 'Set up env', 
  fn: async () => {
    //t.plan(5)
    Deno.env.set('NODE_ENV','testing')

    
    sandbox.start()
    // eslint-disable-next-line
    const dynamo = (await import('../../../../src/tables/dynamo.js')).default

    // DB x callback
    dynamo.db((err, db) => {
      if (err) AssertionError(err)
      assert(db, 'Got DynamoDB object (callback)')
    })
    // DB x direct
    assert(dynamo.direct.db, 'Got DynamoDB object (direct)')

    // Doc x callback
    dynamo.doc((err, doc) => {
      if (err) AssertionError(err)
      assert(doc, 'Got DynamoDB document object (callback)')
    })
    // Doc x direct
    assert(dynamo.direct.doc, 'Got DynamoDB document object (direct)')

    // Session x callback
    dynamo.session((err, doc) => {
      if (err) AssertionError(err)
      assert(doc, 'Got DynamoDB session document object (callback)')
    })

    reset()
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({ 
  name: 'Local port + region configuration', 
  fn: async () => {
    //t.plan(50)

    /**
     * Defaults
     */
    let localhost = 'localhost'
    let defaultPort = 5000
    let defaultRegion = 'us-west-2'
    let host = `${localhost}:${defaultPort}`

    // eslint-disable-next-line
    let dynamo = (await import('../../../../src/tables/dynamo.js')).default

    // DB x callback
    await dynamo.db(async (err, db) => {
      
      if (err) AssertionError(err)

      let endpoint = await db.config.endpoint();
      let region = await db.config.region();

      //assertEquals((await db.config.endpoint()).host, host, `DB configured 'host' property is ${host}`) - v3 db has no property host
      assertEquals(endpoint.hostname, localhost, `DB configured 'hostname' property is ${localhost}`)
      //assertEquals(db.endpoint.href, `http://${host}/`, `DB configured 'href' property is http://${host}/`) - v3 db has no property href
      assertEquals(endpoint.port, defaultPort, `DB configured 'port' property is ${defaultPort}`)
      assertEquals(region, defaultRegion, `DB configured 'region' property is ${defaultRegion}`)
    })

    // DB x direct

    let endpoint = await dynamo.direct.db.config.endpoint();
    let region = await dynamo.direct.db.config.region();

    //assertEquals( (await dynamo.direct.db.config.endpoint()).host, host, `DB configured 'host' property is ${host}`) - v3 db has no property host
    assertEquals( endpoint.hostname, localhost, `DB configured 'hostname' property is ${localhost}`)
    //assertEquals( (await dynamo.direct.db.config.endpoint()).href, `http://${host}/`, `DB configured 'href' property is http://${host}/`)  - v3 db has no property href
    assertEquals( endpoint.port, defaultPort, `DB configured 'port' property is ${defaultPort}`)
    assertEquals( endpoint.port, defaultPort, `DB configured 'port' property is ${defaultPort}`)
    assertEquals( region, defaultRegion, `DB configured 'region' property is ${defaultRegion}`)

    // Doc x callback
    dynamo.doc(async (err, doc) => {
      if (err) AssertionError(err)

      let endpoint = await doc.options.config.endpoint();
      let region = await doc.options.config.region();

      //assertEquals(endpoint.host, host, `Doc configured 'host' property is ${host}`)
      assertEquals(endpoint.hostname, localhost, `Doc configured 'hostname' property is ${localhost}`)
      //assertEquals(endpoint.href, `http://${host}/`, `Doc configured 'href' property is http://${host}/`)
      assertEquals(endpoint.port, defaultPort, `Doc configured 'port' property is ${defaultPort}`)
      assertEquals(region, defaultRegion, `Doc configured 'region' property is ${defaultRegion}`)
    })
    // Doc x direct
    endpoint = await dynamo.direct.doc.options.config.endpoint();
    region = await dynamo.direct.doc.options.config.region();
    //assertEquals(endpoint.host, host, `Doc configured 'host' property is ${host}`)
    assertEquals(endpoint.hostname, localhost, `Doc configured 'hostname' property is ${localhost}`)
    //assertEquals(endpoint.href, `http://${host}/`, `Doc configured 'href' property is http://${host}/`)
    assertEquals(endpoint.port, defaultPort, `Doc configured 'port' property is ${defaultPort}`)
    assertEquals(region, defaultRegion, `Doc configured 'region' property is ${defaultRegion}`)

    // Session x callback
    dynamo.session(async (err, doc) => {
      if (err) AssertionError(err)
      endpoint = await doc.options.config.endpoint();
      region = await doc.options.config.region();
      //assertEquals(endpoint.host, host, `Session doc configured 'host' property is ${host}`)
      assertEquals(endpoint.hostname, localhost, `Session doc configured 'hostname' property is ${localhost}`)
      //assertEquals(endpoint.href, `http://${host}/`, `Session doc configured 'href' property is http://${host}/`)
      assertEquals(endpoint.port, defaultPort, `Session doc configured 'port' property is ${defaultPort}`)
      assertEquals(region, defaultRegion, `Session doc configured 'region' property is ${defaultRegion}`)
    })

    reset()

    /**
     * Custom
     */
    let customPort = 5555
    let customRegion = 'us-east-1'
    Deno.env.set('ARC_TABLES_PORT', customPort)
    Deno.env.set('AWS_REGION', customRegion)
    host = `${localhost}:${customPort}`

    dynamo = (await import('../../../../src/tables/dynamo.js')).default

    // DB x callback
    dynamo.db(async (err, db) => {
      if (err) AssertionError(err)
      endpoint = await db.config.endpoint();
      region = await db.config.region();
      //assertEquals(endpoint.host, host, `DB configured 'host' property is ${host}`)
      assertEquals(endpoint.hostname, localhost, `DB configured 'hostname' property is ${localhost}`)
      //assertEquals(endpoint.href, `http://${host}/`, `DB configured 'href' property is http://${host}/`)
      assertEquals(endpoint.port, customPort, `DB configured 'port' property is ${customPort}`)
      assertEquals(region, customRegion, `DB configured 'region' property is ${customRegion}`)
    })
    // DB x direct
    endpoint = await dynamo.direct.db.config.endpoint();
    region = await dynamo.direct.db.config.region();
    //assertEquals(endpoint.host, host, `DB configured 'host' property is ${host}`)
    assertEquals(endpoint.hostname, localhost, `DB configured 'hostname' property is ${localhost}`)
    //assertEquals(endpoint.href, `http://${host}/`, `DB configured 'href' property is http://${host}/`)
    assertEquals(endpoint.port, customPort, `DB configured 'port' property is ${customPort}`)
    assertEquals(region, customRegion, `DB configured 'region' property is ${customRegion}`)

    // Doc x callback
    dynamo.doc(async (err, doc) => {
      if (err) AssertionError(err)
      endpoint = await doc.options.config.endpoint();
      region = await doc.options.config.region();
      //assertEquals(endpoint.host, host, `Doc configured 'host' property is ${host}`)
      assertEquals(endpoint.hostname, localhost, `Doc configured 'hostname' property is ${localhost}`)
      //assertEquals(endpoint.href, `http://${host}/`, `Doc configured 'href' property is http://${host}/`)
      assertEquals(endpoint.port, customPort, `Doc configured 'port' property is ${customPort}`)
      assertEquals(region, customRegion, `Doc configured 'region' property is ${customRegion}`)
    })
    // DB x direct
    endpoint = await dynamo.direct.doc.options.config.endpoint();
    region = await dynamo.direct.doc.options.config.region();
    //assertEquals(endpoint.host, host, `Doc configured 'host' property is ${host}`)
    assertEquals(endpoint.hostname, localhost, `Doc configured 'hostname' property is ${localhost}`)
    //assertEquals(endpoint.href, `http://${host}/`, `Doc configured 'href' property is http://${host}/`)
    assertEquals(endpoint.port, customPort, `Doc configured 'port' property is ${customPort}`)
    assertEquals(region, customRegion, `Doc configured 'region' property is ${customRegion}`)

    // Session x callback
    dynamo.session(async (err, doc) => {
      if (err) AssertionError(err)
      endpoint = await doc.options.config.endpoint();
      region = await doc.options.config.region();
      //assertEquals(endpoint.host, host, `Session doc configured 'host' property is ${host}`)
      assertEquals(endpoint.hostname, localhost, `Session doc configured 'hostname' property is ${localhost}`)
      //assertEquals(endpoint.href, `http://${host}/`, `Session doc configured 'href' property is http://${host}/`)
      assertEquals(endpoint.port, customPort, `Session doc configured 'port' property is ${customPort}`)
      assertEquals(region, customRegion, `Session doc configured 'region' property is ${customRegion}`)
    })

    reset()
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Live AWS infra config', 
  fn: async () => {
    //t.plan(11)

    // Defaults
    Deno.env.set('NODE_ENV', 'testing')

    let dynamo = (await import('../../../../src/tables/dynamo.js')).default

    // DB x callback
    dynamo.db((err, db) => {
      if (err) AssertionError(err)
      assertEquals(db.config.httpOptions.agent, undefined, 'DB HTTP agent options not set')
    })
    // DB x direct
    assertEquals(dynamo.direct.db.config.httpOptions.agent, undefined, 'DB HTTP agent options not set')

    // Doc x callback
    dynamo.doc((err, doc) => {
      if (err) AssertionError(err)
      assertEquals(doc.service.config.httpOptions.agent, undefined, 'Doc HTTP agent options not set')
    })
    // Doc x direct
    assertEquals(dynamo.direct.doc.service.config.httpOptions.agent, undefined, 'Doc HTTP agent options not set')

    // Session x callback (session table not configured)
    dynamo.session((err, doc) => {
      if (err) AssertionError(err)
      assertEquals(doc.service.config.httpOptions.agent, undefined, 'Session doc HTTP agent options not set')
    })

    reset()

    // Defaults
    Deno.env.set('NODE_ENV', 'staging')
    Deno.env.set('AWS_REGION', 'us-west-1')

    dynamo = (await import('../../../../src/tables/dynamo.js')).default

    // DB x callback
    dynamo.db((err, db) => {
      if (err) AssertionError(err)
      assert(db.config.httpOptions.agent.options, 'DB HTTP agent options set')
    })
    // DB x direct
    assert(dynamo.direct.db.config.httpOptions.agent.options, 'DB HTTP agent options set')

    // Doc x callback
    dynamo.doc((err, doc) => {
      if (err) AssertionError(err)
      assert(doc.service.config.httpOptions.agent.options, 'Doc HTTP agent options set')
    })
    // Doc x direct
    assert(dynamo.direct.doc.service.config.httpOptions.agent.options, 'Doc HTTP agent options set')

    // Session x callback (session table not configured)
    dynamo.session((err, mock) => {
      if (err) AssertionError(err)
      assert(typeof mock.get === 'function' && typeof mock.put === 'function', 'Got back sessions get/put mock')
    })
    // Session x callback (session table configured)
    Deno.env.set('SESSION_TABLE_NAME', 'foo')
    dynamo.session((err, doc) => {
      if (err) AssertionError(err)
      assert(doc.service.config.httpOptions.agent.options, 'Session doc HTTP agent options set')
    })

    reset()
  },
  sanitizeResources: false,
  sanitizeOps: false
})

Deno.test({
  name: 'Tear down env', 
  fn: () => {
    //t.plan(1)
    sandbox.stop()
    Deno.env.set('NODE_ENV',env)
    reset()
    assert('Tore down env')
  },
  sanitizeResources: false,
  sanitizeOps: false
})
