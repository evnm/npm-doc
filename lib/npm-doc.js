var fs = require('fs')
    , path = require('path')
    , npm = require('npm')
    , registry = require('npm/utils/registry')
    , asyncMap = require('npm/utils/async-map');

// Optional controls.
// TODO: Add logging levels for npm-doc itself?
var CONF = {
  npm_loglevel: 'warn'
  , cache_cleaning: true
};

// Augment CONF obj with user-defined values.
function configure (aconf) {
  Object.keys(aconf).forEach(function (c) {
    CONF[c] = aconf[c];
  });
}


function validateArgs(args) {
  var pkgs = args[0], optargs = args[1], cb_ = args[2];
  if (typeof optargs === 'function') cb_ = optargs, optargs = undefined;

  // Deal with config object.
  if (optargs) {
    if (typeof optargs !== 'object')
      cb_(new Error('Optional args must be given as an object'));
    else configure(optargs);
  }

  if (typeof pkgs === 'string') {
    pkgs = [pkgs];
    if (typeof cb_ === 'string') {
      var obj = {};
      obj[pkgs[0]] = cb_;
      pkgs = obj;
      cb_ = Array.prototype.slice.call(arguments).pop();
    }
  }

  return [pkgs, optargs, cb_];
}

// Fetch documetation for a set of packages from npm.
var getDocs = exports.getDocs = function (pkgs, optargs, cb_) {
  if (typeof pkgs === 'function')
    return pkgs(new Error('No packages specified.'));
  var args = validateArgs(Array.prototype.slice.call(arguments));
  pkgs = args[0], optargs = args[1], cb_ = args[2];

  npm.load({loglevel: CONF.npm_loglevel, outfd: null}, function (err) {
    if (err) cb(err);
    else if (Array.isArray(pkgs)) {
      var obj = {};
      asyncMap(pkgs, function (name, cb) {
        registry.get(name, function (err, data) {
          if (err) cb_(err);
          else {
            obj[name] = data['dist-tags'].latest;
            cb();
          }
        });
      }, function (err) {
        if (err) cb_(err);
        else {
          getDocsForPkgs(obj, function (err, docs) {
            if (err) cb_(err);
            else cb_(null, docs);
          })
        }
      });
    } else {
      getDocsForPkgs(pkgs, function (err, docs) {
        if (err) cb_(err);
        else cb_(null, docs);
      });
    }
  });
}

// Fetch documentation for packages specified by an object of
// name:version pairs.
function getDocsForPkgs(pkgs, cb_) {
  var results = {}
      , c = Object.keys(pkgs).length;
  function tryCb () {
    if (--c === 0) {
      if (CONF.cache_cleaning) cleancache(name);
      cb_(null, results);
    }
  }

  Object.keys(pkgs).forEach(function (name) {
    getDocsByVersion(name, pkgs[name], function (err, data) {
      if (err) {
        console.error('Doc fetch failed for ' + name + ': ' + err.stack);
        tryCb();
      } else {
        console.log('got docs for ' + name + ', num left: ' + (c - 1));
        results[name] = {docs: data};
        var cachedir = npm.cache + '/' + name + '/' + pkgs[name] + '/package/';
        getReadme(cachedir, function (err, data) {
          results[name].README = data;
          tryCb();
        });
      }
    });
  });

/*  asyncMap(Object.keys(pkgs), function (name, cb) {
    getDocsByVersion(name, pkgs[name], function (err, data) {
      if (err) cb(err);
      else {
        console.log('got docs for ' + name);
        cb(null, {name: name, docs : data});
      }
    });
  }, function (err, results) {
    if (err) cb_(err);
    else {
      var docobj = {};
      results.forEach(function (pkg) {
        docobj[pkg.name] = pkg.docs;
      });
      cb_(null, docobj);
    }
  });*/
}

// Fetch documentation for a given package@version from npm.
function getDocsByVersion (pkg, version, cb) {
  npm.commands.cache.add(pkg, version, function (err, data) {
    if (err) return cb(err);
    else {
      var cachedir = npm.cache + '/' + pkg + '/' + version + '/package/';
      if (data && data.directories && data.directories.doc &&
          data.directories.doc !== '.') {
        // NOTE: Filtering out pkgs that specify pkg root as doc dir.
        dirToJson(cachedir + data.directories.doc, function(err, obj) {
          cb(err, obj);
        });
      } else cb(null, {});
    }
  });
}

// Locates any README files in the argument dir and inserts them into obj.
function getReadme(dir, cb_) {
  fs.readdir(dir, function(err, files) {
    if (err) cb_(err);
    else {
      asyncMap(files, function(file, cb) {
        if (file.match(/^readme/i) !== null) {
          fs.readFile(dir + file, 'utf8', function(err, data) {
            if (err) cb(err);
            else cb(null, data);
          });
        } else cb();
      }, function (err, results) { cb_(err, results[0]); });
    }
  });
}

// Returns an object of files within the argument directory and all subdirs.
function dirToJson (docdir, cb) {
  fs.readdir(docdir, function (err, files) {
    if (err) cb(err);
    else {
      var result = {}
          , c = files.length + 1;
      function tryCb () { if (--c === 0) cb(null, result); }
      tryCb();
      for (var i = 0; i < files.length; i++) {
        (function () {
          var basename = path.basename(files[i], path.extname(files[i]))
              , _i = i;
          fs.stat(docdir + '/' + files[_i], function(err, stats) {
            if (err) cb(err) && tryCb();
            else if (stats.isDirectory()) {
              // If a dir, then recurse.
              dirToJson(docdir + '/' + files[_i], function(err, data) {
                result[basename] = data;
                tryCb();
              });
            } else {
              fs.readFile(docdir + '/' + files[_i], 'utf8', function (err, data) {
                if (err) cb(err);
                else result[basename] = data;
                tryCb();
              });
            }
          });
        })();
      }
    }
  });
}

// Clean npm cache entry for argument pkg.
function cleancache (pkg) {
  npm.commands.cache.clean([pkg], function (err) {
    if (err) console.error('cache clean failed for ' + pkg);
    else console.log('cleaned cache entry for ' + pkg);
  });
}
