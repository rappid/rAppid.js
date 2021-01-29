var requirejs = require('requirejs'),
    inherit = require('inherit.js').inherit,
    path = require('path'),
    _ = require('lodash'),
    flow = require('flow.js').flow,
    findXamlClasses = require('./findXamlClasses'),

    fs = require('fs');

fs.existsSync || (fs.existsSync = path.existsSync);


var xamlClasses = [];

xamlClasses = xamlClasses.concat(findXamlClasses(path.join(__dirname, '..', 'js')));
xamlClasses = xamlClasses.concat(findXamlClasses(path.resolve()));


var applicationContext;

var TestRunner = function(config, rAppid) {

    var _applicationContext;

    return {
        require: function(dependencies, callback) {
            _applicationContext.$requirejsContext(dependencies, callback);
        },

        requireClasses: function (classes, target, done) {

            if (!(classes instanceof Object && target instanceof Object && done instanceof Function)) {
                throw "parameter missing";
            }

            var self = this;

            flow()
                .seq(function(cb){
                    rAppid.createApplicationContext(null, config, function (err, applicationContext) {
                        _applicationContext = applicationContext;
                        cb();
                    });
                })
                .parEach(classes, function (fqClassName, cb) {
                    self.require([fqClassName], function (factory) {
                        cb(null, factory);
                    })
                })
                .exec(function (err, results) {
                    if (!err) {
                        for (var name in results) {
                            if (results.hasOwnProperty(name)) {
                                target[name] = results[name];
                            }
                        }
                    }

                    done(err);
                });
        },

        getApplicationContext: function () {
            return _applicationContext;
        },

        createSystemManager: function (document, callback) {
            return _applicationContext.createApplicationInstance(document, callback);
        }


    }
};

function readJSON(path) {
    return JSON.parse(fs.readFileSync(path));
}

module.exports =  function(rAppid) {

    return {
        // creates a new testRunner
        /***
         *
         * @param {Object} [config]
         */
        setup: function (config) {

            if (!config) {
                // read and parse it
                config = this.buildConfig();

                config.xamlClasses = xamlClasses;

            }

            return new TestRunner(config, rAppid);

        },

        buildConfig: function(configPath) {

            var config = {};

            function addToConfig(moduleConf) {
                for (var key in moduleConf) {
                    if (moduleConf.hasOwnProperty(key)) {
                        if (config[key]) {
                            if (_.isArray(config[key])) {
                                _.defaults(config[key], moduleConf[key]);
                            } else {
                                _.extend(config[key], moduleConf[key]);
                            }

                        } else {
                            config[key] = moduleConf[key];
                        }
                    }
                }
            }

            addToConfig(readJSON(path.join(__dirname, '..', 'config.json')));

            var modulePath = configPath || path.resolve("config.json");
            if (fs.existsSync(modulePath)) {
                addToConfig(readJSON(modulePath));
            }

            if (config.paths) {
                // point paths to correct sources
                for (var key in config.paths) {
                    if (config.paths.hasOwnProperty(key)) {

                        if (/^js/.test(config.paths[key])) {
                            // prepend absolute path
                            config.paths[key] = path.join(__dirname, '..', config.paths[key]);
                        }
                    }
                }
            }

            config.paths = config.paths || {};
            config.paths.js = path.join(__dirname, '..', 'js');

            config.nodeRequire = require;
            config.baseUrl = configPath ? path.dirname(configPath) : path.resolve();
            config.namespaceMap = config.namespaceMap || rAppid.defaultNamespaceMap;
            config.rewriteMap = config.rewriteMap || rAppid.defaultRewriteMap;

            return config;
        },

        TestRunner: TestRunner
    };
};
