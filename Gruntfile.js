module.exports = function (grunt) {
    var flow = require("flow.js").flow,
        tunnel,
        afterWebTestCallback,
        dbName = "ticketTest";

    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.initConfig({
        lint: {
            files: ['grunt.js', 'js/**/*.js', 'srv/**/*.js', 'lib/*.js', 'bin/**/*.js']
        },

        connect: {
            server: {
                options: {
                    port: 8080
                }
            }
        },

        seleniumGrid: {
            host: "127.0.0.1",
            port: 5555
        },

        runWebTests: {
            firefox: {
                browserName: "firefox"
            }
            ,chrome: {
                browserName: "chrome"
            }
//            ,ie: {
//                browserName: "internet explorer",
//                version: "9"
//            }
        }

    });

    grunt.registerMultiTask('runWebTests', 'runs the webtest', function () {

        this.requires("connect");

        var WebTestRunner = require("./").WebTestRunner,
            _ = require("underscore"),
            done = this.async(),
            grid = grunt.config.get("seleniumGrid") || {
                host: "127.0.0.1",
                port: 4444
            },
            desired = this.data;

        WebTestRunner(_.extend({}, grid, {
            desired: desired
        }), function(err, runner) {

            if (afterWebTestCallback) {
                afterWebTestCallback(runner, function() {
                    done(err ? false : null);
                });
            } else {
                done(err ? false : null);
            }

        });

    });

    grunt.registerTask('connectToSauceLabs', 'Establish a tunnel between this machine an saucelabs.com', function (username, password) {

        var done = this.async(),
            Tunnel = require("saucelabs-tunnel").Tunnel,
            SauceLabs = require("saucelabs"),
            saucelabs;

        username = username || process.env["SAUCE_USERNAME"];
        password = password || process.env["SAUCE_ACCESS_KEY"];

        tunnel = new Tunnel({
            username: username,
            password: password
        });

        saucelabs = new SauceLabs({
            username: username,
            password: password
        });

        afterWebTestCallback = function(runner, callback) {

            saucelabs.updateJob(runner.sessionId, {
                name: "rappidjs-" + (process.env["TRAVIS_BRANCH"] || "") + "#" + (process.env["TRAVIS_BUILD_NUMBER"] || ""),
                public: true,
                build: process.env["TRAVIS_JOB_ID"],
                passed: runner.results.failedTests.length === 0 && runner.results.errorTests.length === 0,
                "custom-data": runner.results
            }, callback);
        };

        tunnel.connect(function (err) {
            if (!err) {
                grunt.config.set("seleniumGrid", {
                    host: "ondemand.saucelabs.com",
                    port: 80,
                    username: username,
                    password: password
                });
            }

            done(err);
        });

    });

    grunt.registerTask('disconnectFromSauceLabs', 'Disconnect saucelabs.com', function () {
        this.requires("connectToSauceLabs");
        tunnel.disconnect(this.async());
    });

    grunt.registerTask('webtest-saucelabs', ["connect", "connectToSauceLabs", "runWebTests", "disconnectFromSauceLabs"]);

    grunt.registerTask('webtest-local', ["connect", "runWebTests"]);

    grunt.registerTask('test', ['unit-tests', 'server-tests']);

    grunt.registerTask('unit-tests', 'Runs unit-tests for rAppid.js', function () {
        var done = this.async();
        require('child_process').exec('mocha -R spec', function (err, stdOut) {
            grunt.log.write(stdOut);
            done(err);
        });
    });

    grunt.registerTask('server-tests', 'Runs tests for rAppid.js server side', function() {
        var done = this.async(),
            childProcess = require('child_process'),
            Path = require("path"),
            Fs = require("fs"),
            mochaError,
            server;

        flow()
            .seq(function(cb) {
                flow()
                    .seq(function() {
                        var basePath = Path.join(__dirname, "test", "server", "rest"),
                            paths = {};

                        paths[Path.join(basePath, "js")] = __dirname + "/js";
                        paths[Path.join(basePath, "srv")] = __dirname + "/srv";

                        for (var base in paths) {
                            if (paths.hasOwnProperty(base) && !Fs.existsSync(base)) {
                                // sym link missing -> create it
                                Fs.symlinkSync(paths[base], base);
                            }
                        }
                    })
                    .seq(function (cb) {
                        childProcess.exec('mongo ' + dbName + ' test/server/setup/setup_mongo.js', function (err, stdOut) {
                            grunt.log.write(stdOut);
                            cb(err);
                        });
                    })
                    .seq(function (cb) {

                        // start server
                        require(__dirname + "/bin/lib/server.js")({
                            environment: "test",
                            serverRoot: __dirname + "/test/server/rest",
                            documentRoot: __dirname  + "/test/server/public"
                        }, function(err, instance) {

                            if (!err) {
                                server = instance;
                            }

                            cb(err);
                        });

                    })
                    .exec(cb);
            })
            .seq(function(cb) {

                require('child_process').exec('mocha -R spec test/server/test/*', function (err, stdOut, stdErr) {
                    grunt.log.write(stdOut);
                    grunt.log.write(stdErr);
                    mochaError = err;
                    cb();
                });
            })
            .seq(function(cb) {
                // clean up

                flow()
                    .seq(function (cb) {
                        // shutdown server
                        if (server) {
                            server.shutdown(cb);
                        } else {
                            cb();
                        }
                    })
                    .seq(function(cb) {
                        // cleanup database
                        childProcess.exec('mongo ' + dbName + ' --eval "db.dropDatabase()"', function () {
                            cb();
                        });
                    })
                    .exec(cb);
            })
            .seq(function() {
                if (mochaError) {
                    throw new Error("Some tests has errors");
                }
            })
            .exec(function(err) {
                done(err ? false : null);
            });

    });

    grunt.registerTask("default");

}
;