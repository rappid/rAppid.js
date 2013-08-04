var findXamlClasses = require(__dirname + '/lib/findXamlClasses'),
    rAppid = require(__dirname + '/js/lib/rAppid.js').rAppid,
    TestRunner = require(__dirname + '/lib/TestRunner'),
    WebTestRunner = require(__dirname + '/lib/WebTestRunner'),
    flow = require(__dirname + '/js/lib/flow.js').flow;

module.exports = {
    rAppid: rAppid,
    findXamlClasses: findXamlClasses,
    TestRunner: TestRunner(rAppid),
    WebTestRunner: WebTestRunner,
    flow: flow
};

