#!/usr/bin/env node
var sys = require('util'),
    fs = require("fs"),
    path = require("path"),
    child_process = require('child_process');

var source = path.join(__dirname,"conditionGrammar.pegjs");
var target = path.join(__dirname,"..","srv/lib/conditionParser.js");

var child = child_process.exec(["pegjs","-e","'var exports = (typeof(exports) === \"undefined\" ? this : exports); exports.parser'",source,target].join(" "), {cwd: __dirname}, function (err, stdout, stderr) {
    sys.print('stdout: ' + stdout);
    sys.print('stderr: ' + stderr);
});