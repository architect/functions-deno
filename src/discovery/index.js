import { SSM } from '../deps.ts'

/**
 * @param {string} type - events, queues, or tables
 * @returns {object} {name: value}
 */
function lookup (type, callback) {

  let Path = `/${Deno.env.get('ARC_CLOUDFORMATION')}`
  let Recursive = true
  let values = []

  function getParams (params) {
    let isType = p => p.Name.split('/')[2] === type
    let ssmClient = new SSM
    ssmClient.getParametersByPath(params, function done (err, result) {
      if (err) {
        callback(err)
      }
      else if (result.NextToken) {
        values = values.concat(result.Parameters.filter(isType))
        getParams({ Path, Recursive, NextToken: result.NextToken })
      }
      else {
        values = values.concat(result.Parameters.filter(isType))
        callback(null, values.reduce((a, b) => {
          a[b.Name.split('/')[3]] = b.Value
          return a
        }, {}))
      }
    })
  }

  getParams({ Path, Recursive })
}

export default {
  events: lookup.bind({}, 'events'),
  queues: lookup.bind({}, 'queues'),
  tables: lookup.bind({}, 'tables')
}
