/* eslint camelcase:0, complexity: 1 */
/**
 * MongoDB driver errors for humans.
 *
 */
var boom = require('boom');
var debug = require('debug')('scout-server:mongodb-error');

/**
 * Is the error returned from the driver caused
 * by an access control restriction?
 *
 * @example
 *   var err = new Error('not authorized on admin to execute '
 *     + 'command { getCmdLineOpts: 1 }');
 *   require('mongodb-error').isNotAuthorized(err);
 *   >>> true
 *
 * @param {Error} [err]
 * @return {Boolean}
 * @api public
 */
exports.isNotAuthorized = function(err) {
  if (!err) {
    return false;
  }
  var msg = err.message || err.err || JSON.stringify(err);
  return new RegExp('^not authorized').test(msg);
};

/**
 * Is the error returned from the driver caused
 * by running a replicaset command on an instance
 * that is not using replication?
 *
 * @param {Error} [err]
 * @return {Boolean}
 * @api public
 */
exports.isNotReplicaset = function(err) {
  if (!err) {
    return false;
  }
  var msg = err.message || err.err || JSON.stringify(err);
  return new RegExp('^not running with --replSet').test(msg);
};

/**
 * Is the error returned from the driver caused
 * by running a replicaset command on a Router instance?
 *
 * @param {Error} [err]
 * @return {Boolean}
 * @api public
 */
exports.isRouter = function(err) {
  if (!err) {
    return false;
  }
  var msg = err.message || err.err || JSON.stringify(err);
  return new RegExp('^replSetGetStatus is not supported through mongos').test(msg);
};

/**
 * Take errors from the driver and converts them into the appropriate
 * `boom` error instances with more user friendly messages.
 *
 * @param {Error} err - The error from a driver call.
 * @param {Function} fn - Callback which receives a potentially updated `(err)`.
 * @return {void}
 * @api public
 */
exports.decode = function mongodb_error_decode(err, fn) {
  if (err && err.isBoom) {
    debug('no decoding required');
    process.nextTick(fn.bind(null, err));
    return;
  }

  var msg = err.message || JSON.stringify(err);
  debug('decoding error message: `%s`', msg);
  /**
   * mongod won't let us connect anymore because we have too many idle
   * connections to it.  Restart the process to flush and get back to
   * a clean state.
   */
  if (/connection closed/.test(msg)) {
    err = boom.serverTimeout('Too many connections to mongod');
  } else if (/cannot drop/.test(msg)) {
    err = boom.badRequest('This index cannot be destroyed');
  } else if (/auth failed/.test(msg)) {
    err = boom.forbidden('Invalid auth credentials');
  } else if (/connection to \[.*\] timed out/.test(msg)) {
    err = boom.notFound('Could not connect to MongoDB because the conection timed out');
  } else if (/failed to connect/.test(msg)) { // Host not reachable
    err = boom.notFound('Could not connect to MongoDB.  Is it running?');
  } else if (/does not exist/.test(msg)) {
    err = boom.notFound(msg);
  } else if (/already exists/.test(msg)) {
    err = boom.conflict(msg);
  } else if (/pipeline element 0 is not an object/.test(msg)) {
    err = boom.badRequest(msg);
  } else if (/(target namespace exists|already exists)/.test(err.message)) {
    err = boom.conflict('Collection already exists');
  } else if (/server .* sockets closed/.test(msg)) {
    err = boom.serverTimeout('Too many connections to MongoDB');
  } else if (/connect ECONNREFUSED/.test(msg)) {
    err = boom.notFound('MongoDB not running');
  } else if (err.name === 'MongoError') {
    // All unknown driver errors to bubble up.
    err = boom.badImplementation(err.message);
    err.driver = true;
  } else {
    debug('does not look like a driver error');
    process.nextTick(fn.bind(null, err));
    return;
  }
  debug('decoded error is: `%s`', err.message);
  process.nextTick(fn.bind(null, err));
};

module.exports = exports;
