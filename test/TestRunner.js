var requirejs = require('requirejs'),
    inherit = require('inherit.js').inherit,
    path = require('path');

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

exports.require = r;