var rappid = require(".."),
    webdriver = require('wd'),
    expect = require('chai').expect;

describe('#test', function () {

    var beforeExecuted = false;
    var webTestRunner;

    before(function(done) {
        webTestRunner = new rappid.WebTestRunner();
        expect(webTestRunner).to.exist;

        webTestRunner.startPhantomJsProcess(null, function(err) {
            beforeExecuted = true;
            done(err);
        });

    });

    after(function(done) {
        if (webTestRunner) {
            webTestRunner.stopPhantomJsProcess(done);
        } else {
            done();
        }
    });

    // TODO: open test page automatically
    // start phantomjs
    describe("#general", function() {

        it("should execute before", function() {
            expect(beforeExecuted).to.be.true;
        })
    })

});