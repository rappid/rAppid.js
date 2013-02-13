module.exports = function (grunt) {
    var flow = require("flow.js").flow,
        tunnel;

    grunt.initConfig({
        lint: {
            files: ['grunt.js', 'js/**/*.js', 'srv/**/*.js', 'lib/*.js', 'bin/**/*.js']
        },

        server: {
            port: 8080
        },

        seleniumGrid: {
            host: "127.0.0.1",
            port: 5555
        },

        runWebTests: {
            firefox: {
                browserName: "firefox"
            }
            ,
            chrome: {
                browserName: "chrome"
            },
            ie: {
                browserName: "internet explorer",
                version: "9"
            }
        }

    });

    grunt.registerMultiTask('runWebTests', 'runs the webtest', function () {

        this.requires("server");

        var WebTestRunner = require("./").WebTestRunner,
            _ = require("underscore"),
            done = this.async(),
            grid = grunt.config.get("seleniumGrid") || {
                host: "127.0.0.1",
                port: 4444
            },
            desired = this.data;

        console.log(grid, desired);

        WebTestRunner(_.extend({}, grid, {
            desired: desired
        }), function(err) {

            // TODO: update job status if saucelabs was used
            done(err ? false : null);
        });

    });


    grunt.registerTask('connectToSauceLabs', 'Establish a tunnel between this machine an saucelabs.com', function (username, password) {

        var done = this.async(),
            Tunnel = require("saucelabs-tunnel").Tunnel;

        username = username || process.env["SAUCE_USERNAME"];
        password = password || process.env["SAUCE_ACCESS_KEY"];

        tunnel = new Tunnel({
            username: username,
            password: password
        });

        tunnel.connect(function (err) {
            if (!err) {
                grunt.config.set("seleniumGrid", {
                    host: "ondemand.saucelabs.com",
                    port: 80,
                    username: username,
                    password: password
                })
            }

            done(err);
        });

    });

    grunt.registerTask('disconnectFromSauceLabs', 'Disconnect saucelabs.com', function () {
        this.requires("connectToSauceLabs");
        tunnel.disconnect(this.async());
    });

    grunt.registerTask('webtest-saucelabs', ["server", "connectToSauceLabs", "runWebTests", "disconnectFromSauceLabs"]);

    grunt.registerTask('webtest-local', ["server", "runWebTests"]);


    grunt.registerTask("default")

}
;