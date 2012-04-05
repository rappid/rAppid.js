module.exports = install;

install.usage = "rappidjs install <pkg>"
    + "\nrappidjs install <pkg>@<version>"
    + "\nrappidjs install <pkg> <version>"
    + "\nrappidjs install <pkg> <version> <dir>"
    + "\nInstalls rAppidjs dependencies from ./package.json.";

var sys = require('util')
var child_process = require('child_process');
var fs = require("fs"),
    path = require("path"),
    readJson = require("npm/lib/utils/read-json.js"),
    flow = require("flow.js").flow,
    child;


var dir;

function install(args, callback) {
    if (args.length === 0) {
        callback("No args defined");
    }
    var packageName = args.shift();
    var what = packageName;
    if (args.length > 0) {
        args.shift();
        // what += "@"+args.shift();
    }
    if(args.length > 0){
        dir = args.shift();
    }else{
        dir = dir || process.cwd();
    }

    dir = path.resolve(dir.replace(/^~\//, process.env.HOME + '/'));

    var originalWD = process.cwd();
    // change dir
    // process.chdir(dir);

    child = child_process.exec(["npm","install",what,"-d"].join(" "), function (err, stdout, stderr) {
        sys.print('stdout: ' + stdout);
        sys.print('stderr: ' + stderr);

        if(!err){
            linkPackage(dir, packageName, callback);
        }else{
            callback(err);
        }


    });
}


function linkPackage(dir, packageName ,callback){
    var publicDir = path.join(dir, "public");
    var packageDir = path.join(dir, "node_modules", packageName);

    readJson(path.join(packageDir, "package.json"), function (err, data) {
        if (!err){
            data.lib = "js";
            var libDir = path.join(publicDir, data.lib);

            fs.symlinkSync(path.join(packageDir, data.lib), libDir);

            var dependencies = data.rAppidDependencies || {};
            var f = flow();

            function doInstall(dName, dVersion) {
                f.seq(function (cb) {
                    install([dName, dVersion], cb);
                });
            }

            for (var key in dependencies) {
                if (dependencies.hasOwnProperty(key)) {
                    doInstall(key, dependencies[key]);
                }
            }
            f.exec(function (err) {
                // if all dependencies are installed
                if (!err) {
                    // process.chdir(originalWD);
                    require(path.join(__dirname, 'config.js'))([path.join(publicDir, "config.json")], callback);
                } else {
                    callback(err);
                }

            });
        }else{
            callback(err);
        }

    });
}

