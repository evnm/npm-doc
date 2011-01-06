var assert = require('assert')
  , doc = require('../lib/npm-doc');

module.exports = {
  'test failure on invalid pkg': function () {
    doc.getDocs('not-a-valid-pkg-asdf', function (err, data) {
      assert.isNotNull(err);
    });
  },

  'test failure on invalid pkg with version': function () {
    doc.getDocs({'not-a-valid-pkg-asdf': '0.0.1'}, function (err, data) {
      assert.isNotNull(err);
    })
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
    doc.getDocs('npm', function (err, data) {
      assert.isDefined(data);
    });
  },

  'test success on pkgname array': function () {
    doc.getDocs(['npm'], function (err, data) {
      assert.isDefined(data);
    });
  },

  'test success on pkgname:version object': function () {
    doc.getDocs({'dropbox': '0.1.3'}, function (err, data) {
      assert.isDefined(data);
    });
  }
}
