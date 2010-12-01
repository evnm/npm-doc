# npm-doc

An asynchronous fetcher of npm package documentation.

## Installation

    npm install npm-doc

## Usage

Packages can be specified in three ways:

* A package name (i.e. "npm" or "dropbox")
* An array of package names (i.e. ["npm"] or ["connect", "express", "dnode"])
* An object of package name:version pairs (i.e. {"npm-doc": "0.0.1", "oauth": "0.8.3"})

In the absence of specific version information, the docs of the latest versions are fetched.

### Examples

    var doc = require("npm-doc");

    // Note that getDocs wouldn't normally be called in sequence like this.
    // Packages can be specified by...

    // ...a single package name.
    doc.getDocs("npm", function (err, data) {
      if (err) console.error(err.stack);
      else console.log(data);
    });

    // ...an array of package names.
    doc.getDocs(["npm", "express", "socket.io"] , function (err, data) {
      if (err) console.error(err.stack);
      else console.log(data);
    });

    // ... or an object of name:version pairs.
    doc.getDocs({"oauth": "0.8.0", "jade": "0.5.6"}, function (err, data) {
      if (err) console.error(err.stack);
      else console.log(data);
    });

The returned data available to the callback is an object that maps package names to nested objects containing docs. Doc objects are of the format:

    { docs: <Object containing names and text of doc markdown files>,
      README: <Text of README markdown file>
    }

Thus, fetching docs for npm would yield:

    { npm:
      { docs:
        { activate: ...
          adduser: ...
          build: ...
          ...
        }
        , README: ...
      }
    }

## Uninstallation

    npm uninstall npm-doc

## TODO

* Toggle logging.
* Remove object argument format in favor of an array of name@version strings.

