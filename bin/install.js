module.exports = install;

install.usage = "rappidjs install <pkg>"
    + "\nrappidjs install <pkg> <version>"
    + "\nInstalls rAppidjs dependencies from ./package.json.";

var sys = require('util')
var exec = require('child_process').exec;
var fs = require("fs"),
    path = require("path"),
    readJson = require("npm/lib/utils/read-json.js"),
    flow = require("flow.js").flow;


var dir;

function install(args, callback) {
    if (args.length === 0) {
        callback("No args defined");
    }
    var packageName = args.shift();
    var what = packageName;
    if (args.length > 0) {
        what += "@" + args.shift();
    }

    // executes `pwd`
    exec("npm install" + what, function (err, stdout, stderr) {
        sys.print('stdout: ' + stdout);
        sys.print('stderr: ' + stderr);
        if (!err) {

            dir = dir || process.cwd();

            var publicDir = path.join(dir, "Public");
            var packageDir = path.join(__dirname,"..","node_modules", packageName);
            readJson(path.join(packageDir, "package.json"), function (er, data) {
                if (er) data = null;

                fs.symlinkSync(path.join(publicDir, data.lib), path.join(packageDir, data.lib));

                var dependencies = data.rAppidDependencies;
                var f = flow();

                function doInstall(dName, dVersion, cb) {
                    install([dName, dVersion].join("@"), cb);
                }

                for (var key in dependencies) {
                    if (dependencies.hasOwnProperty(key)) {
                        f.seq(function (cb) {
                            doInstall(key, dependencies[key], cb);
                        });
                    }
                }
                f.exec(callback);
            });

        } else {
            callback("Error while installing " + packageName);
        }
    });
}