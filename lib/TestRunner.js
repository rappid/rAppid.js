var requirejs = require('requirejs'),
    inherit = require('inherit.js').inherit,
    path = require('path'),
    underscore = require('underscore'),
    flow = require('flow.js').flow,
    findXamlClasses = require('./findXamlClasses'),
    rAppid = require('../rAppid');


var xamlClasses = [];

xamlClasses = xamlClasses.concat(findXamlClasses(path.join(__dirname, '..', 'js')));
xamlClasses = xamlClasses.concat(findXamlClasses(path.resolve()));

var config = {
    nodeRequire: require,
    baseUrl: path.resolve(),
    paths: {
        "xaml": path.join(__dirname, '..', 'js', 'plugins', 'xaml'),
        "json": path.join(__dirname, '..', 'js', 'plugins', 'json'),
        "js": path.join(__dirname, '..', 'js')
    },
    xamlClasses: xamlClasses,
    namespaceMap: rAppid.defaultNamespaceMap,
    rewriteMap: rAppid.defaultRewriteMap
};

var r = requirejs.config(config);

requirejs.define("inherit", function(){
    return inherit;
});

requirejs.define("underscore", function () {
    return underscore;
});

requirejs.define("flow", function () {
    return flow;
});

var applicationContext;

module.exports = {
    require: r,
    config: config,
    getApplicationContext: function() {
        if (!applicationContext) {
            applicationContext = new rAppid.ApplicationContext(r, config);
        }

        return applicationContext;
    },
    createSystemManager: function(document) {
        return new rAppid.SystemManager(r, this.getApplicationContext(), document);
    }
};