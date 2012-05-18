var findXamlClasses = require(__dirname + '/lib/findXamlClasses'),
    rAppid = require(__dirname + '/rAppid.js'),
    flow = require('flow.js').flow,
    TestRunner = require(__dirname + '/lib/TestRunner');

module.exports = {
    rAppid: rAppid,
    findXamlClasses: findXamlClasses,
    TestRunner: TestRunner,
    require: TestRunner.require,
    requireClasses: function(classes, target, done) {

        if (!(classes instanceof Object && target instanceof Object && done instanceof Function)) {
            throw "parameter missing";
        }

        flow()
            .parEach(classes, function(fqClassname, cb) {
                TestRunner.require([fqClassname], function(factory) {
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
    }
};

