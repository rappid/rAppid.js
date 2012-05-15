var findXamlClasses = require(__dirname + '/lib/findXamlClasses'),
    rAppid = require(__dirname + '/rAppid.js'),
    TestRunner = require(__dirname + '/lib/TestRunner');

module.exports = {
    rAppid: rAppid,
    findXamlClasses: findXamlClasses,
    TestRunner: TestRunner,
    require: TestRunner.require
};

