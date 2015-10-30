/* eslint camelcase: 0 */
var boom = require('boom');
var decode = require('./').decode;
var debug = require('debug')('mongodb-errors:express');

function onDecoded(req, res, next, err) {
  if (!err.isBoom && err.name === 'MongoError') {
    if (err.command) {
      debug('Driver error running command `%s`:', err.command, err.stack);
    } else {
      debug('Driver error:', err.stack);
    }
    err = boom.badImplementation(err.message);
    err.driver = true;
  }

  // All unknown driver errors to bubble up.
  if (err.driver) {
    err.output.payload.message = err.message;
  }
  next(err);
}

function mongodb_error_middleware(err, req, res, next) {
  decode(err, onDecoded.bind(null, req, res, next));
}

module.exports = mongodb_error_middleware;
