#!/usr/bin/env node

var fs = require("fs"),
    path = require("path"),
    args = process.argv.splice(2),
    util = require('util'),
    exec = require('child_process');

var dox = require("dox");

var targetDir = path.join(process.cwd(), "doc", "docs");
var dir = ".";
var exclude_dirs = ["node_modules", "bin", "doc", "test"];
var excludes = ["atlassian-ide-plugin.xml"];

var types = ["xml", "js"];

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

        if (exclude_dirs.indexOf(name) === -1 && name.substring(0, 1) !== ".") {
            name = path.join(dir, name);

            var exclude = false;
            excludes.forEach(function(item) {
                if (item instanceof RegExp) {
                    if (item.test(name)) {
                        exclude = true;
                    }
                } else if (name === item){
                    exclude = true;
                }
            });

            if (!exclude) {
                var stat = fs.statSync(name);

                if (stat.isDirectory()) {
                    ret = ret.concat(findJsFiles(name));
                } else {

                    var ext = path.extname(name).toLowerCase().substring(1);
                    if (types.indexOf(ext) !== -1) {
                        ret.push({
                            type: ext,
                            path: name,
                            className: name.replace(/\//g, ".")
                        });
                    }
                }
            }
        }
    });

    return ret;
}

var modules = findJsFiles(dir);
fs.writeFileSync(path.join(targetDir, "index.json"), JSON.stringify(modules));


modules.forEach(function(module){

    var out;
    try {
        out = dox.parseComments(fs.readFileSync(module.path, "utf-8"));
    } catch (e) {
        util.debug("Couldn't generate documentation for '" + module.path + "'.");
    }

    out = out || {};

    fs.writeFileSync(path.join(targetDir, module.className + ".json"), JSON.stringify(out));

});



console.log(modules);
