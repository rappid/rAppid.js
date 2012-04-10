var fs = require("fs"),
    path = require("path"),
    child;

var postinstall = function (args, callback) {

    var rappidDir = path.join(__dirname, "..");
    var nodeModules = path.join(rappidDir, "node_modules");
    var libDir = path.join(rappidDir, "js", "lib");
    var libraries = {
        "rAppid.js":path.join(rappidDir, "rAppid.js"),
        "require.js":path.join(nodeModules, "requirejs", "require.js"),
        "flow.js":path.join(nodeModules, "flow.js", "lib", "flow.js"),
        "inherit.js":path.join(nodeModules, "inherit.js", "inherit.js"),
        "underscore-min.js":path.join(nodeModules, "underscore", "underscore-min.js")
    };

    for (var lib in libraries) {
        if (libraries.hasOwnProperty(lib)) {
            try {
                fs.symlinkSync(libraries[lib], path.join(libDir, lib));
            } catch (e) {
                console.log(e);
            }
        }
    }
};

postinstall.usage = "rappidjs postinstall links hard dependency libs into lib folder\n";

module.exports = postinstall;

