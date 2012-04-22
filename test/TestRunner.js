var requirejs = require('requirejs'),
    inherit = require('inherit.js').inherit,
    path = require('path'),
    underscore = require('underscore'),
    flow = require('flow.js').flow;

var r = requirejs.config({
    nodeRequire: require,
    baseUrl: path.join(__dirname, '..'),
    paths: {
        "xaml": "js/plugins/xaml",
        "json": "js/plugins/json"
    }
});

requirejs.define("inherit", function(){
    return inherit;
});

requirejs.define("underscore", function () {
    return underscore;
});

requirejs.define("flow", function () {
    return flow;
});

exports.require = r;