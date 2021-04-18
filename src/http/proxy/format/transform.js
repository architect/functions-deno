/**
 * transform reduces {headers, body} with given plugins
 *
 * @param args - arguments obj
 * @param args.Key - the origin S3 bucket Key requested
 * @param args.config - the entire arc.proxy.public config obj
 * @param args.defaults - the default {headers, body} in the transform pipeline
 */
export default function transform ({ Key, config, isBinary, defaults }) {
  let filetype = Key.split('.').pop()
  let plugins = config.plugins ? config.plugins[filetype] || [] : []
  // early return if there's no processing to do
  if (plugins.length === 0 || isBinary)
    return defaults
  else {
    defaults.body = defaults.body.toString() // Convert non-binary files to strings for mutation
    // otherwise walk the supplied plugins
    return plugins.reduce(function run (response, plugin) {
      /* eslint global-require: 'off' */
      let transformer = typeof plugin === 'function' ? plugin : require(plugin)
      return transformer(Key, response, config)
    }, defaults)
  }
}
