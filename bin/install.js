module.exports = install;

install.usage = "rappidjs install <pkg>"
    + "\nrappidjs install <pkg> <version>"
    + "\nInstalls rAppidjs dependencies from ./package.json.";

var npm = require("npm.js"),
    fs = require("fs"),
    path = require("path"),
    readJson = require("npm/utils/read-json.js"),
    flow = require("flow.js").flow;


var dir;

function install(args, callback){
    if(args.length  === 0){
        callback("No args defined");
    }
    var packageName = args.shift();
    var what = packageName;
    if(args.length > 0){
        what += "@"+args.shift();
    }

    // try to install package
    npm.commands.install(what, function(err, installed){
        if(!err){
            if(installed){

                dir = dir || process.cwd();

                var publicDir = path.join(dir,"Public");
                var where = path.resolve(npm.dir, "..");
                var packageDir = path.join(dir,"node_modules",packageName);
                readJson(path.join(packageDir,"package.json"),function(er, data){
                    if (er) data = null;

                    fs.symlinkSync(path.join(publicDir, data.lib), path.join(packageDir, data.lib));

                    var dependencies = data.rAppidDependencies;
                    var f = flow();
                    for(let key in dependencies){
                        if(dependencies.hasOwnProperty(key)){
                            f.seq(function (cb) {
                                install([key,dependencies[key]].join("@"), cb);
                            });
                        }
                    }
                    f.exec(callback);
                });


            }else{
                callback("Installation failed");
            }
        }else{
            callback("Error while installing " + packageName);
        }
    });
}