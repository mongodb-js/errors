var errors = require('../');
var assert = require('assert');

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
});
