# mongodb-errors [![travis][travis_img]][travis_url] [![npm][npm_img]][npm_url]

> Helpers for handling errors from the MongoDB driver.

## Example

```javascript
var express = require('express');
var app = module.exports = express();

app.use(require('mongodb-js-errors/express'));
app.use(function(err, req, res) {
  var payload = err.output.payload;
  res.format({
    text: function() {
      res.status(err.output.statusCode).send(payload.message);
    },
    json: function() {
      res.status(err.output.statusCode).send(payload);
    }
  });
});
```

## License

Apache 2.0

[travis_img]: https://img.shields.io/travis/mongodb-js/errors.svg
[travis_url]: https://travis-ci.org/mongodb-js/errors
[npm_img]: https://img.shields.io/npm/v/mongodb-js-errors.svg
[npm_url]: https://npmjs.org/package/mongodb-js-errors
