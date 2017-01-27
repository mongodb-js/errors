var errors = require('../');
var assert = require('assert');
var expect = require('chai').expect;
var boom = require('boom');

describe('mongodb-errors', function() {
  it('should work', function() {
    assert(errors);
  });

  describe('express', function() {
    it('should be requireable', function() {
      assert(require('../express'));
    });
    it('should work', function(done) {
      var d = new Error('Something weird...');
      d.name = 'MongoError';
      require('../express')(d, {}, {}, function(err) {
        assert(err);
        done();
      });
    });
  });

  describe('#isNotAuthorized', function() {
    it('should not match null', function() {
      expect(errors.isNotAuthorized(null)).to.equal(false);
    });
    it('should not match `operation exceeded time limit` errors', function() {
      var err = new Error('operation exceeded time limit');
      expect(errors.isNotAuthorized(err)).to.equal(false);
    });

    it('should match `not authorized on <db> to execute command <cmdSpec>`', function() {
      var err = new Error('not authorized on admin to execute command { getCmdLineOpts: 1 }');
      expect(errors.isNotAuthorized(err)).to.equal(true);
    });
  });

  describe('#translate', function() {
    context('when the regex matches', function() {
      var expected = 'MongoDB not running on the provided host and port';

      it('returns the mapping', function() {
        expect(errors.translate('ENOTFOUND').message).to.equal(expected);
      });
    });

    context('when the regex does not match', function() {
      it('returns null', function() {
        expect(errors.translate('not an error')).to.equal(null);
      });
    });

    context('when the error is internal', function() {
      it('returns a ServerError', function() {
        var result = errors.translate('BSONObj size: 26360608 (0x1923B20) is invalid. Size must be between 0 and 16793600(16MB)');
        expect(result.message).to.equal('Response from server was too large to process');
        expect(result.func).to.equal(boom.badImplementation);
      });
    });

    context('when the command is not available', function() {
      it('returns a Bad Request', function() {
        var result = errors.translate('Command Top returned error: MongoError: no such cmd: top');
        expect(result.message).to.equal('Top command is not available in mongos');
        expect(result.func).to.equal(boom.badRequest);
      });
    });
  });
});
