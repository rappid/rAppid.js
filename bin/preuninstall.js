var fs = require("fs"),
    path = require("path"),
    child;

fs.existsSync || (fs.existsSync = path.existsSync);

var preuninstall = function (args, callback) {

    var rappidDir = path.join(__dirname, ".."),
        nodeModules = path.join(rappidDir, "node_modules"),
        libDir = path.join(rappidDir, "js", "lib"),
        libraries = {
        "rAppid.js": path.join(rappidDir, "rAppid.js")
    };

    if (fs.existsSync(libDir)) {
        for (var lib in libraries) {
            if (libraries.hasOwnProperty(lib)) {
                try {
                    fs.unlinkSync(path.join(libDir, lib));
                } catch(e) {
                    console.warn('Error while unlinking');
                }
            }
        }
    }
};

preuninstall.usage = "rappidjs preuninstall removes linked dependencies\n";

module.exports = preuninstall;

