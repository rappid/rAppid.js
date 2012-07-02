var fs = require("fs"),
    path = require('path'),
    rAppidJsNode = require('./lib/rAppidJsNode.js'),
    jsdom = require('jsdom').jsdom,
    flow = require('flow.js').flow;

var cleanPath = function(dirPath){
    return path.resolve(dirPath.replace(/^~\//, process.env.HOME + '/'));
};

var exportApp = function (args, callback) {
    if (args.length >= 0 && args.length <= 2) {
        var exportDir = args.shift() || path.join(process.cwd(),"target"),
            srcDir = args.shift() || path.join(process.cwd(),"public");

        exportDir = cleanPath(exportDir);
        srcDir = cleanPath(srcDir);

        if (path.existsSync(srcDir)) {
            copyDirectory(srcDir,exportDir);
        }else{
            callback("Couldn't find source dir of project");
        }



    } else {
        // show usage
        callback(true);
    }
};

var copyDirectory = function(srcDir, targetDir){
    var subDirs = [];
    if (!path.existsSync(targetDir)) {
        fs.mkdirSync(targetDir);
    }
    var source, dest;
    fs.readdirSync(srcDir).forEach(function (name) {

        source = path.join(srcDir, name);
        dest = path.join(targetDir, name);
        var stat = fs.statSync(source);
        if(name.indexOf(".") !== 0){
            if (stat.isDirectory()) {
                subDirs.push(name);
            } else if (stat.isFile() || stat.isSymbolicLink()) {
                var inStr = fs.createReadStream(source);
                var outStr = fs.createWriteStream(dest);

                inStr.pipe(outStr);
            }
        }
    });

    subDirs.forEach(function(dirName){
        source = path.join(srcDir, dirName);
        dest = path.join(targetDir, dirName);

        copyDirectory(source, dest);
    });

};


exportApp.usage = "rappidjs export <targetDirectory> [srcDirectory]" +
    "\n\ttargetDirectory - export dir of the application" +
    "\n\tsrcDirectory - directory which contains the app directory";
module.exports = exportApp;
