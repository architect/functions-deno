import oldPublish from './publish-old.js'
import publish from './publish.js'
import subscribe from './subscribe.js'


export default {

  /**
   * arc.queues.publish
   *
   * publish to an sqs queue
   *
   * @param {Object} params
   * @param {String} params.name - the queue name (required)
   * @param {String} params.payload - a json event payload (required)
   * @param {Function} callback - a node style errback (optional)
   * @returns {Promise} - returned if no callback is supplied
   */
  publish (params, callback) {
    if (Deno.env.get('ARC_CLOUDFORMATION')) {
      return publish(params, callback)
    }
    else {
      return oldPublish(params, callback)
    }
  },

  /**
   * arc.queues.subscribe
   *
   * handle payloads published to the queue
   *
   * @param {Function} handler - a single queue handler function
   * @returns {Lambda} - a Lambda function sig: (event, context, callback)=>
   */
  subscribe,
}
