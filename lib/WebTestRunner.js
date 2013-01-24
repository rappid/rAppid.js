var child_process = require('child_process');


var WebTestRunner = function () {
};

WebTestRunner.defaults = {
    seleniumGrid: {

    },

    phantomJs: {
        phantomJsPath: "/Users/tony/bin/phantomjs",
        webdriverPort: 8080,
        selenium: {
            protocol: "http",
            host: "127.0.0.1",
            port: 5555
        }
    }
};

WebTestRunner.prototype = {

    startSelenium: function () {
        // java -jar ~/Frameworks/selenium-server-standalone-2.25.0.jar -role hub -port 5555
    },

    startPhantomJsProcess: function (configuration, callback) {

        var callbackCalled = false,
            internalCallback = function (err) {

                if (callbackCalled) {
                    console.error(new Error("Callback called multiple times"));
                    return;
                }

                if (process) {
                    process.removeListener("exit", exitHandler);
                    process.stdout.removeListener("data", stdOutHandler);
                    process.stderr.removeListener("data", stdErrHandler);
                }

                callback && callback(err);
            };

        configuration = configuration || WebTestRunner.defaults.phantomJs;

        var gridConfiguration = configuration.selenium;

        var args = [
            "--webdriver=" + configuration.webdriverPort,
            "--webdriver-selenium-grid-hub=" + gridConfiguration.protocol + "://" + gridConfiguration.host + ":" + gridConfiguration.port
        ];

        // phantomjs --webdriver=8080 --webdriver-selenium-grid-hub=http://127.0.0.1:4444
        var process = child_process.spawn(configuration.phantomJsPath, args);
        this.phantomJsProcess = process;

        var stdOutHandler = function (data) {
            if (data.indexOf("(ok)") !== -1) {
                internalCallback();
            }
        };

        var stdErrHandler = function () {
            internalCallback(new Error());
        };

        var exitHandler = function (code) {
            internalCallback(new Error("Process exited with code: " + code));
        };

        process.stdout.on('data', stdOutHandler);
        process.stderr.on('data', stdErrHandler);
        process.stdout.setEncoding('utf8');

        process.on('exit', exitHandler);


    },

    stopPhantomJsProcess: function (callback) {

        var p = this.phantomJsProcess;
        if (p) {

            p.on('exit', function () {
                callback();
            });

            p.kill();

        } else {
            callback();
        }

    }

};

module.exports = WebTestRunner;