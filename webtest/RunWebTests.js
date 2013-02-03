var fs = require("fs"),
    path = require("path"),
    Mocha = require("mocha"),
    chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    WebDriver = require("wd"),
    flow = require("..").flow,
    argv = require("optimist")
        .default("test-group", "all")
        .default("host", "127.0.0.1")
        .default("port", "4444")
        .default("timeout", "30000")
        .default("baseUrl", "http://localhost:8080")
        .default("username", process.env["SAUCE_USERNAME"])
        .default("password", process.env["SAUCE_ACCESS_KEY"])
        .argv;

process.stdin.resume();
process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err);
    end(err);
});

process.on('SIGINT', function () {
    console.error('Got SIGINT.');
    process.exit(2);
});

var testGroup = argv["test-group"],
    groups,
    browser,
    tests,
    desired,
    failedTests = [],
    skippedTests = [],
    passedTests = [];

groups = JSON.parse(fs.readFileSync(path.join(__dirname + "/groups.json"), "utf8"));
tests = testGroup in groups ? groups[testGroup] : groups["all"];

browser = new WebDriver.remote(argv.host, argv.port, argv.username, argv.password);

browser.setHTTPInactivityTimeout(argv.timeout);
browser.on('status', function (info) {
    console.log('\x1b[36m%s\x1b[0m', info);
});
browser.on('command', function (meth, path) {
    console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);
});

desired = {
    browserName: "firefox",
    name: "rAppid.js [" + testGroup + "]"
};

global.browser = browser;
global.expect = expect;
global.should = should;
global.flow = flow;
global.SkipError = function (message) {
    this.message = message;
};

flow()
    .seq(function (cb) {
        browser.init(desired, cb);
    })
    .seq(function (cb) {
        // run browser tests
    })
    .seqEach(tests, function (test, cb) {

        if (!test instanceof Object) {
            // TODO:
        }

        if (test.type === "wb") {
            var fileName = path.join(__dirname, "test", test.test);

            // start mocha
            var reporter,
                mocha = new Mocha({
                    timeout: argv.timeout,
                    reporter: function (r) {
                        reporter = r;

                        r.on('pass', function (test) {
                            test.fileName = test;
                            passedTests.push(test);
                        });

                        r.on('fail', function (test, err) {
                            test.fileName = fileName;
                            test.error = err;

                            if (err instanceof global.SkipError) {
                                skippedTests.push(test);
                            } else {
                                failedTests.push(test);
                            }
                        });
                    }
                });

            mocha.addFile(fileName);

            flow()
                .seq(function (cb) {
                    browser.get(argv.baseUrl + "/webtest/test/wd.html?application=" + test.app, cb);
                })
                .seq(function (cb) {
                    mocha.run(function () {
                        cb();
                    });
                })
                .exec(function () {
                    cb();
                });
        } else {
            cb();
        }

    })
    .seq(function () {

        console.log(failedTests.length === 0 ? "SUCCESS" : "FAILED");

        console.log("Failed tests: " + failedTests.length);
        console.log("Skipped tests: " + skippedTests.length);
        console.log("Passed tests: " + passedTests.length);

        console.log();
        for (var i = 0; i < failedTests.length; i++) {
            var obj = failedTests[i];

            console.log(obj.fileName);
            console.log(obj.title);
            console.log(obj.error.message || obj.error);
            console.log();

        }

    })
    .exec(function (err) {
        err && console.error(err);
        err = err || (failedTests.length > 0 ? 100 : 0);

        end(err);
    });

function end(err) {

    flow()
        .seq(function (cb) {

            if (browser) {
                browser.quit(cb);
            } else {
                cb();
            }

        })
        .seq(function (cb) {
            setTimeout(cb, 1000);
        })
        .exec(function () {
            process.exit(err || 0);
        });
}
