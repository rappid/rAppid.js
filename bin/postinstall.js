var fs = require("fs"),
    path = require("path"),
    child;

fs.existsSync || (fs.existsSync = path.existsSync);

var postinstall = function (args, callback) {

    var rappidDir = path.join(__dirname, "..");
    var nodeModules = path.join(rappidDir, "node_modules");
    var libDir = path.join(rappidDir, "js", "lib");
    var libraries = {
        "rAppid.js":path.join(rappidDir, "rAppid.js"),
        "require.js":path.join(nodeModules, "requirejs", "require.js"),
        "flow.js":path.join(nodeModules, "flow.js", "lib", "flow.js"),
        "inherit.js":path.join(nodeModules, "inherit.js", "inherit.js"),
        "underscore.js":path.join(nodeModules, "underscore", "underscore.js")
    };

    if (!fs.existsSync(libDir)) {
        fs.mkdirSync(libDir);
    }

    for (var lib in libraries) {
        if (libraries.hasOwnProperty(lib)) {
            try {
                fs.symlinkSync(libraries[lib], path.join(libDir, lib));
            } catch (e) {
                console.warn('Error while sym linking, trying to copy libs');
                // try to copy
                var inStr = fs.createReadStream(libraries[lib]);
                var outStr = fs.createWriteStream(path.join(libDir, lib));

                inStr.pipe(outStr);
            }
        }
    }
};

postinstall.usage = "rappidjs postinstall links hard dependency libs into lib folder\n";

module.exports = postinstall;

