#!/usr/bin/env node
var sys = require('util'),
    fs = require("fs"),
    path = require("path"),
    child_process = require('child_process');

var source = path.join(__dirname,"grammar.pegjs");
var target = path.join(__dirname,"..","js/lib/parser.js");

var child = child_process.exec(["pegjs", "--allowed-start-rules varName,string,number,float,boolean,index,parameter,parameterArray,var,fnc,pathElement,path,binding,twoWayBinding,staticBinding,text,eventHandler", "-e", "'var exports = (typeof(exports) === \"undefined\" ? this : exports); exports.parser'", source, target].join(" "), {cwd: __dirname}, function (err, stdout, stderr) {
    sys.print('stdout: ' + stdout);
    sys.print('stderr: ' + stderr);

});