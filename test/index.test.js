var errors = require('../');
var assert = require('assert');
var expect = require('chai').expect;

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
  });
});
