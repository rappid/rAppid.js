var flow = require('flow.js').flow,
    fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    jsdom = require('jsdom').jsdom,
    rAppid = require(path.join(__dirname, '../../rAppid.js')).rAppid,
    requirejs = require('requirejs');

var bootStrap = function() {

};

var createApplicationContext = function(applicationDir, applicationFilename, configFilename, applicationBaseUrl, callback) {

    flow()
        .seq("applicationConfig", function (cb) {
            fs.readFile(path.join(applicationDir, configFilename), function (err, data) {
                if (!err) {
                    data = JSON.parse(data);
                    _.extend(data, {

                        baseUrl: applicationDir,
                        nodeRequire: require,

                        applicationDir: applicationDir,
                        applicationUrl: applicationBaseUrl
                    });
                }

                cb(err, data);
            });
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

module.exports.bootStrapApplication = bootStrap;
module.exports.createApplicationContext = createApplicationContext;