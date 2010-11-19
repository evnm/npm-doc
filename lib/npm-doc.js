var fs = require('fs')
    , path = require('path')
    , npm = require('npm')
    , asyncMap = require('npm/utils/async-map');

// Fetch documetation and README for a given package from npm.
var fetchDocs = exports.fetchDocs = function (pkg, version, cb) {
  if (typeof version === 'function') cb = version, version = undefined;
  npm.load({loglevel: 'warn', outfd: null}, function (err) {
    if (err) cb(err);
    else {
      // If none specified, determine the latest version.
      if (version === undefined) {
        npm.commands.view([pkg], function (err, data) {
          if (err) cb(err);
          else {
            version = data[pkg]['dist-tags']['latest']
            fetchDocsByVersion(pkg, version, function (err, data) {
              cb(err, data), cleancache(pkg, version);
            });
          }
        });
      } else {
        fetchDocsByVersion(pkg, version, function (err, data) {
          cb(err, data), cleancache(pkg, version);
        });
      }
    }
  });
}

// Fetch documetation and README for a given package@version from npm.
function fetchDocsByVersion (pkg, version, cb) {
  npm.commands.cache.add(pkg, version, function (err, data) {
    if (err) cb(err);
    else {
      var cachedir = npm.cache + '/' + pkg + '/' + version + '/package/'
      if (data && data.directories && data.directories.doc) {
        dirToJson(cachedir + data.directories.doc, function(err, obj) {
          insertModuleReadme(cachedir, obj, cb);
        });
      } else insertModuleReadme(cachedir, {}, cb);
    }
  });
}

// Locates any README files in the argument dir and inserts them into obj.
function insertModuleReadme(dir, obj, cb) {
  fs.readdir(dir, function(err, files) {
    if (err) cb(err);
    else {
      asyncMap(files, function(file, cb_) {
        if (file.match(/^README/) !== null) {
          fs.readFile(dir + file, 'utf8', function(err, data) {
            if (err) cb(err);
            else {
              obj[file] = data;
              cb(null, obj);
            }
          });
        }
      }, cb);
    }
  });
}

// Returns an object of files within the argument directory and all subdirs.
function dirToJson (docdir, cb) {
  fs.readdir(docdir, function (err, files) {
    if (err) cb(err);
    else {
      var result = {}
          , c = files.length;
      function tryCb () { if (--c === 0) cb(null, result); }
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

// Clean npm cache for argument pkg and version.
function cleancache (pkg, version) {
  npm.commands.cache.clean([pkg, version], function(err) {
    if (err) cb(err);
  });
}