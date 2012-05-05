module.exports = init;

init.usage = "rappidjs init <dir>"
    + "\nLinks all dependencies in the project dir";

var fs = require("fs"),
    path = require("path"),
    flow = require("flow.js").flow,
    install = require(path.join(__dirname, "install.js"));


function readJson(path, callback) {
    try {
        callback(null, JSON.parse(fs.readFileSync(path)));
    } catch(e) {
        callback(e);
    }
}


function init(args, callback) {
    if (args.length > 0) {
        dir = args.shift();
    } else {
        dir = process.cwd();
    }

    // read out package.json
    readJson(path.join(dir, "package.json"), function (err, data) {
        if (!err) {

            var dependencies = data.rAppid.dependencies, depArray = [];
            var installFlow = flow();
            for(var dep in dependencies){
                if(dependencies.hasOwnProperty(dep)){
                    depArray.push({package: dep, version: dependencies[dep]});
                }
            }
            flow().seqEach(depArray,function (dep,cb) {
                install([dep.package, dep.version], cb);
            }).exec(callback);
        } else {
            callback(err);
        }
    });

}
