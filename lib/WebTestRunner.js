module.exports = function(options, moduleCallback) {

    var _ = require("underscore"),
        fs = require("fs"),
        path = require("path"),
        Mocha = require("mocha"),
        chai = require('chai'),
        should = chai.should(),
        expect = chai.expect,
        WebDriver = require("wd"),
        flow = require("..").flow;

    options = options || {};

    _.defaults(options, {
        testGroup: "all",
        host: "127.0.0.1",
        port: "4444",
        timeout: 30000,
        desired: {
            browserName: "firefox"
        },
        baseUrl: "http://localhost:8080",
        username: null,
        password: null,
        dir: path.join(__dirname, "..", "webtest"),
        verbose: true
    });

    _.defaults(options, {
        sessionName: "[" + options.testGroup + " - " + options.desired.browserName + "]"
    });

    options.dir = path.resolve(options.dir);

    var testGroup = options.testGroup,
        groups,
        browser,
        tests,
        desired,
        failedTests = [],
        skippedTests = [],
        passedTests = [],
        errorTests = [],
        returnObject;

    groups = JSON.parse(fs.readFileSync(path.join(options.dir,  "groups.json"), "utf8"));
    tests = testGroup in groups ? groups[testGroup] : groups["all"];

    browser = new WebDriver.remote(options.host, options.port, options.username, options.password);

    browser.setHTTPInactivityTimeout(options.timeout);
    browser.on('status', function (info) {
        options.verbose && console.log('\x1b[36m%s\x1b[0m', info);
    });
    browser.on('command', function (meth, path) {
        options.verbose && console.log(' > \x1b[33m%s\x1b[0m: %s', meth, path);
    });

    desired = options.desired;

    global.browser = browser;
    global.expect = expect;
    global.should = should;
    global.flow = flow;
    global.SkipError = function (message) {
        this.message = message;
    };

    returnObject = {
        browser: browser,
        end: end,
        sessionId: null,
        status: null,
        capabilities: null,
        results: {
            failedTests: failedTests,
            skippedTests: skippedTests,
            passedTests: passedTests,
            errorTests: errorTests
        }
    };

    if (options.verbose) {
        console.log("Using options: ");
        var opt = _.extend({}, options);
        if (opt.password) {
            opt.password = "[secure]";
        }

        console.log(JSON.stringify(opt, null, 4));
    }

    flow()
        .seq("sessionId", function (cb) {
            browser.init(desired, cb);
        })
        .par({
            status: function (cb) {
                browser.status(cb);
            },
            capabilities: function(cb) {
                browser.sessionCapabilities(cb);
            }
        })
        .seq(function() {
            returnObject.status = this.vars["status"];
            returnObject.capabilities = this.vars["capabilities"];
        })
        .seq(function (cb) {
            // run browser tests

            flow()
                .seq(function (cb) {
                    browser.get(options.baseUrl + "/webtest/?testgroup=" + options["test-group"], cb);
                })
                .seq("testResults", function (cb) {

                    waitForComplete();

                    function waitForComplete() {

                        setTimeout(function () {
                            // TODO: better make use of execute_async
                            browser.execute("return window.testResults", function (err, testResults) {

                                if (err) {
                                    cb(err);
                                } else {
                                    if (testResults) {
                                        cb(null, testResults);
                                    } else {
                                        // another round trip
                                        waitForComplete();
                                    }
                                }
                            });
                        }, 1000);
                    }
                })
                .exec(function (err, results) {
                    if (err) {
                        errorTests.push({
                            fileName: "browser tests",
                            error: err
                        });
                    } else {
                        var testResults = results["testResults"];
                        errorTests = errorTests.concat(testResults.errorTests);
                        failedTests = failedTests.concat(testResults.failedTests);
                        skippedTests = skippedTests.concat(testResults.skippedTests);
                        passedTests = passedTests.concat(testResults.passedTests);
                    }

                    cb();
                });
        })
        .seqEach(tests, function (test, cb) {

            if (!test instanceof Object) {
                // TODO:
            }

            if (test.type === "wb") {
                var fileName = path.join(options.dir, "test", test.test);

                // start mocha
                var reporter,
                    mocha = new Mocha({
                        timeout: options.timeout,
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
                        browser.get(options.baseUrl + "/webtest/test/wd.html?application=" + test.app, cb);
                    })
                    .seq(function (cb) {
                        mocha.run(function () {
                            cb();
                        });
                    })
                    .exec(function (err) {
                        if (err) {
                            errorTests.push({
                                fileName: fileName,
                                error: err
                            });
                        }

                        cb();
                    });
            } else {
                cb();
            }

        })
        .seq(function () {

            console.log(failedTests.length === 0 && errorTests.length === 0 ? "SUCCESS" : "FAILED");

            console.log("Error Tests: " + errorTests.length);
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
                moduleCallback && moduleCallback(err, returnObject);
            });
    }

    return returnObject;

};