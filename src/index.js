/**
 * Ensure env is one of: 'testing', 'staging', or 'production'
 * - Some test harnesses (ahem) will automatically populate NODE_ENV with their own values, unbidden
 * - Due to tables.direct auto initializing, always set (or override) default NODE_ENV to 'testing'
 */

import events from './events/index.js'
import http from './http/index.js'
import queues from './queues/index.js'
import _static from './static/index.js'
import tables from './tables/index.js'
import send from './ws/index.js'

let arc = {
  events,
  http,
  queues,
  static: _static,
  tables,
  ws: { send },
}

// backwards compat
arc.proxy = {}
arc.proxy.public = http.proxy.public
arc.middleware = http.middleware
// backwards compat

export default arc
