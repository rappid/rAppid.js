var path = require("path"),
    webtest = function (args, callback) {

        callback = callback || function () {
        };

        var optimist = require("optimist")(args)
            .default("testGroup", "all")
            .default("host", "127.0.0.1")
            .default("port", "4444")
            .default("timeout", "30000")
            .default("browser", "firefox")
            .default("baseUrl", "http://localhost:8080")
            .default("dir", path.resolve("webtest"))
            .default("sessionName", "webtest")
            .default("verbose", true)
            .describe({
                username: "username for authentication against selenium grid",
                password: "password for authentication against selenium grid"
            });

        var argv = optimist.argv,
            WebTestRunner, runner;

        if ("help" in argv) {
            optimist.showHelp();
            callback();
            return;
        }

        // get the runner
        WebTestRunner = require("..").WebTestRunner;

        delete argv["$0"];
        delete argv["_"];

        // and start it
        runner = WebTestRunner(argv, function (err, runner) {
            process.exit(err ? 1 : 0);
        });

        // IO
        process.stdin.resume();
        process.on('uncaughtException', function (err) {
            console.error('Caught exception: ' + err);
            runner.end(err);
        });

        process.on('SIGINT', function () {
            try {
                runner && runner.end();
            } catch (e) {
                console.error(e);
            }

            console.error('Got SIGINT.');
            process.exit(2);
        });

    };

webtest.usage = function () {
    webtest(["--help"]);
};

module.exports = webtest;


