var rappid = require(".."),
    webdriver = require('wd'),
    expect = require('chai').expect,
    flow = rappid.flow;

describe('#test', function () {

    var beforeExecuted = false,
        webTestRunner,
        browser;

    before(function (done) {
        webTestRunner = new rappid.WebTestRunner();
        expect(webTestRunner).to.exist;

        webTestRunner.startPhantomJsProcess(null, function (err) {
            beforeExecuted = true;
            done(err);
        });
    });

    beforeEach(function (done) {

        browser = webdriver.remote({
            host: "127.0.0.1",
            port: 5555
        });

        browser.on('status', function (info) {
            console.log('\x1b[36m%s\x1b[0m', info);
        });
        browser.on('command', function (meth, path) {
            console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);
        });

        flow()
            .seq(function (cb) {
                browser.init({
                    browserName: "phantomjs",
                    tags: ["examples"],
                    name: "This is an example test"
                }, cb)
            })
            .seq(function (cb) {
                browser.get("http://google.de", cb);
            })
            .exec(done);

    });

    afterEach(function(done) {
        browser.quit(done);
    });


    // TODO: open test page automatically
    // start phantomjs
    describe("#general", function () {

        it("should execute before", function () {
            expect(beforeExecuted).to.be.true;
        });

        it("first test on google", function (done) {

            flow()
                .seq("element", function (cb) {
                    browser.elementByCssSelector("input[type='text']", cb)
                })
                .seq(function (cb) {
                    this.vars.element.type("rAppid.js", cb);
                })
                .exec(function (err) {
                    expect(err).to.not.exist;
                })

        })
    });


    after(function (done) {
        if (webTestRunner) {
            webTestRunner.stopPhantomJsProcess(done);
        } else {
            done();
        }
    });

});