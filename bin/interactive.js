var rl = require("readline"),
    path = require("path"),
    flow = require("flow.js").flow;

var interactive = function (args, callback) {

    var i = rl.createInterface(process.stdin, process.stdout, null),
        defaultDir = path.resolve(process.cwd());

    flow()
        .seq("projectType", function (cb) {
            i.question("Create an project [app, lib] ? (app) ", function (projectType) {
                projectType = projectType.toLowerCase() || "app";

                if (projectType == "app" || projectType == "lib") {
                    cb(null, projectType);
                } else {
                    cb(true);
                }
            })
        })
        .seq("dir", function (cb) {
            i.question("Directory? (" + defaultDir + ") ", function (answer) {
                cb(null, answer || defaultDir);
            });
        })
        .seq("name", function (cb) {
            i.question("Project name? (Test) ", function (answer) {
                cb(null, answer || "Test");
            })
        })
        .exec(function (err, results) {

            function end() {
                i.close();
                process.stdin.destroy();
                callback();
            }

            if (!err) {
                var create = require(path.join(__dirname, "create"));
                create([results.projectType, results.name, results.dir], function () {
                    end();
                });
            } else {
                end();
            }

        });

};

interactive.usage = "rappidjs interactive\n" +
    "\tuser interactive installation helper";

module.exports = interactive;

