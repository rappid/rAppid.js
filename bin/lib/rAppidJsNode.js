var flow = require('flow.js').flow,
    fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    jsdom = require('jsdom').jsdom,
    rAppid = require(path.join(__dirname, '../../rAppid.js')).rAppid,
    requirejs = require('requirejs');

var bootStrap = function() {

};

var createApplicationContext = function(applicationDir, applicationFilename, config, applicationBaseUrl, callback) {

    flow()
        .seq("applicationConfig", function (cb) {

            function extendConfig(err, conf) {
                conf = conf || {};

                cb(err, _.defaults(conf, {

                    baseUrl: applicationDir,
                    nodeRequire: require,

                    applicationDir: applicationDir,
                    applicationUrl: applicationBaseUrl
                }));
            }

            if (_.isString(config)) {
                fs.readFile(path.join(applicationDir, config), function (err, data) {
                    if (!err) {
                        data = JSON.parse(data);
                    }

                    extendConfig(err, data);
                });
            } else {
                extendConfig(null, config);
            }

        })
        .seq("applicationContext", function (cb) {
            rAppid.createApplicationContext(requirejs, null, applicationFilename, this.vars.applicationConfig, cb);
        })
        .seq(function () {
            this.vars.applicationContext.document = jsdom('<html></html>');
        }).
        exec(function(err, results) {
            if (callback) {
                callback(err, results.applicationContext);
            }
        });
};

var requireInTestContext = function(applicationDir, classes, callback) {

    if (_.isArray(applicationDir)) {
        callback = classes;
        classes = applicationDir;
        applicationDir = null;
    }

    applicationDir = applicationDir || path.join(__dirname, "..", "..");

    createApplicationContext(applicationDir, null, null, null, function (err, applicationContext) {
        if (err) {
            callback(err);
        } else {
            applicationContext.require(classes, function(){
                callback.apply(applicationContext, Array.prototype.slice.call(arguments));
            });
        }
    })
};

module.exports.bootStrapApplication = bootStrap;
module.exports.createApplicationContext = createApplicationContext;
module.exports.requireInTestContext = requireInTestContext;