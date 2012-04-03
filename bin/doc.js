#!/usr/bin/env node

var fs = require("fs"),
    path = require("path"),
    args = process.argv.splice(2);

var targetDir = path.join(process.cwd(), "doc", "docs");
var dir = ".";
var exclude_dirs = ["node_modules", "bin", "doc", "test"];

fs.mkdirParent = function (dirPath) {
    if (!path.existsSync(dirPath)) {
        var parentDir = path.normalize(path.join(dirPath, ".."));
        if (!path.existsSync(parentDir)) {
            fs.mkdirParent(parentDir);
        }

        fs.mkdirSync(dirPath);
    }
};


// generate targetDir
if (!path.existsSync(targetDir)) {
    fs.mkdirParent(targetDir);
}

function findJsFiles(dir) {

    var ret = [];

    fs.readdirSync(dir).forEach(function(name) {

        if (exclude_dirs.indexOf(name) === -1) {
            name = path.join(dir, name);

            var stat = fs.statSync(name);

            if (stat.isDirectory()) {
                ret = ret.concat(findJsFiles(name));
            } else {

                if (path.extname(name).toLowerCase() == ".js") {

                    ret.push(name);
                }
            }
        }


    });

    return ret;
}

var files = findJsFiles(dir);
fs.writeFileSync(path.join(targetDir, "index.json"), JSON.stringify(files));

