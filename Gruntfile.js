module.exports = function (grunt) {
    var flow = require("flow.js").flow,
        tunnel,
        afterWebTestCallback;

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
            ,ie: {
                browserName: "internet explorer",
                version: "9"
            }
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


    grunt.registerTask("default");

}
;