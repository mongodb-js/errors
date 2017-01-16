/* eslint camelcase:0, complexity: 0 */
/**
 * MongoDB driver errors for humans.
 *
 */
var boom = require('boom');
var debug = require('debug')('scout-server:mongodb-error');

/**
 * A mapping of a boom function to a message.
 *
 * @param {Function} func - The boom function.
 * @param {String} message - The message.
 */
function Mapping(func, message) {
  this.func = func;
  this.message = message;
}

/**
 * Translate the message to a mapping.
 *
 * @param {String} msg - The message to translate.
 *
 * @returns {Mapping} The function/message mapping.
 */
function translate(msg) {
  if (/connection closed/.test(msg)) {
    return new Mapping(boom.serverTimeout, 'The connection to MongoDB was closed');
  } else if (/cannot drop/.test(msg)) {
    return new Mapping(boom.badRequest, 'This index cannot be destroyed');
  } else if (/(auth failed|Authentication Failed)/.test(msg)) {
    return new Mapping(boom.forbidden, 'Invalid auth credentials');
  } else if (/(ECONNREFUSED|ENOTFOUND)/.test(msg)) {
    return new Mapping(boom.notFound, 'MongoDB not running on the provided host and port');
  } else if (/connection to \[.*\] timed out/.test(msg)) {
    return new Mapping(boom.notFound, 'Could not connect to MongoDB because the conection timed out');
  } else if (/failed to connect/.test(msg)) { // Host not reachable
    return new Mapping(boom.notFound, 'Could not connect to MongoDB on the provided host and port');
  } else if (/does not exist/.test(msg)) {
    return new Mapping(boom.notFound, msg);
  } else if (/already exists/.test(msg)) {
    return new Mapping(boom.conflict, msg);
  } else if (/pipeline element 0 is not an object/.test(msg)) {
    return new Mapping(boom.badRequest, msg);
  } else if (/(target namespace exists|already exists)/.test(msg)) {
    return new Mapping(boom.conflict, 'Collection already exists');
  } else if (/server .* sockets closed/.test(msg)) {
    return new Mapping(boom.serverTimeout, 'The connection to MongoDB was closed');
  } else if (/operation exceeded time limit/.test(msg)) {
    return new Mapping(boom.serverTimeout, 'Operation exceeded the specified time limit');
  } else if (/Error from KDC: UNKNOWN_SERVER/.test(msg)) {
    return new Mapping(boom.serverTimeout, 'Invalid service name');
  } else if (/Matching credential/.test(msg)) {
    return new Mapping(boom.badRequest, 'Invalid principal');
  } else if (/self signed certificate in certificate chain/.test(msg)) {
    return new Mapping(boom.badRequest, 'Invalid or missing certificate');
  } else if (/No credentials cache file found/.test(msg)) {
    return new Mapping(boom.badRequest, 'Kerberos not detected on provided connection details');
  } else if (/socket hang up/.test(msg)) {
    return new Mapping(boom.serverTimeout, 'Socket could not establish connection to provided host and port');
  } else if (/BSONObj size/.test(msg)) {
    return new Mapping(boom.badImplementation, 'Response from server was too large to process');
  } else if (/no such cmd: top/.test(msg)) {
    return new Mapping(boom.badRequest, 'Top command is not available in mongos');
  }
  return null;
}

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
  var mapping = translate(msg);

  if (mapping === null) {
    if (err.name === 'MongoError') {
      // All unknown driver errors to bubble up.
      mapping = new Mapping(boom.badImplementation, msg);
    } else {
      debug('does not look like a driver error');
      process.nextTick(fn.bind(null, err));
      return;
    }
  }
  debug('decoded error is: `%s`', mapping.message);
  process.nextTick(fn.bind(null, mapping.func.call(null, mapping.message)));
};

module.exports = exports;
module.exports.translate = translate;
