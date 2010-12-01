var assert = require('assert')
  , doc = require('../lib/npm-doc');

// So hacky...git multiple calls to getDocs can't be made concurrently, so I'm
// using arbitrary setTimeouts to try to space things out.
module.exports = {
  'test failure on invalid pkg': function () {
    doc.getDocs('not-a-valid-pkg-asdf', {npm_loglevel: 'silent'},
                function (err, data) {
                  assert.isNotNull(err);
              });
  },

  'test failure on invalid pkg with version': function () {
    setTimeout(function () {
      doc.getDocs({'not-a-valid-pkg-asdf': '0.0.1'}, function (err, data) {
        assert.isNotNull(err);
      })}, 500);
  },

  'test failure on invalid version of valid pkg': function () {
    doc.getDocs('npm', 'a.b.c', function (err, data) {
      assert.isNotNull(err);
    });
  },

  'test failure on no pkg or version': function () {
    doc.getDocs(function (err, data) {
      assert.isNotNull(err);
    });
  },

  'test success on pkgname string': function () {
    setTimeout(function () {
      doc.getDocs('npm', function (err, data) {
        assert.isDefined(data);
      });
    }, 1000);
  },

  'test success on pkgname array': function () {
    setTimeout(function () {
      doc.getDocs(['npm'], function (err, data) {
        assert.isDefined(data);
      });
    }, 1500);
  },

  'test success on pkgname:version object': function () {
    setTimeout(function () {
      doc.getDocs({'dropbox': '0.1.3'}, function (err, data) {
        assert.isDefined(data);
      });
    }, 2000);
  }
}
