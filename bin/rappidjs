#!/usr/bin/env node

var fs = require("fs"),
    path = require("path"),
    flow = require("flow.js").flow,
    ejs = require('ejs'),
    args = process.argv.splice(2),
    rl = require("readline");

var Helper = {
    template: function (source, destination, options) {
        var data = fs.readFileSync(source, "utf8");
        fs.writeFileSync(destination, this.render(data, options));

    },
    render: function (string, options) {
        if (options == null) options = {};
        return ejs.render(string, options);
    },
    copy: function (source, destination) {
        var data = fs.readFileSync(source, "utf8");
        fs.writeFileSync(destination, data);
    }
};

fs.mkdirIfNotExist = function(dirPath) {
    if(!path.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
};

fs.mkdirParent = function (dirPath) {
    if (!path.existsSync(dirPath)) {
        var parentDir = path.normalize(path.join(dirPath, ".."));
        if (!path.existsSync(parentDir)) {
            fs.mkdirParent(parentDir);
        }

        fs.mkdirSync(dirPath);
    }
};

function init(appName, dir) {
    dir = dir || process.cwd();

    appName = appName.charAt(0).toUpperCase() + appName.substr(1);

    if (appName) {
        if (!path.existsSync(dir)) {
            console.log("Directory " + dir + " doesn't exist");
        } else {
            var publicDir = path.join(dir, "public");
            try {
                fs.mkdirSync(publicDir);
            } catch (e) {
            }

            var rappidDir = path.normalize(path.join(__dirname, ".."));
            var localRappidDir = path.join(dir, "node_modules", "rAppid.js");

            path.exists(localRappidDir, function (exists) {
                if (exists) {
                    rappidDir = localRappidDir;
                }

                try {
                    fs.symlinkSync(path.join(rappidDir, "js"), path.join(publicDir, "js"));
                } catch (e) {
                    console.warn("js dir is already linked");
                }

                var libDir = path.join(publicDir, "lib");
                try {
                    fs.mkdirSync(libDir);
                } catch (e) {
                }
                var nodeModules = path.join(rappidDir, "node_modules");
                var libraries = {
                    "rAppid.js": path.join(rappidDir, "rAppid.js"),
                    "require.js": path.join(nodeModules, "requirejs", "require.js"),
                    "flow.js": path.join(nodeModules, "flow.js", "lib", "flow.js"),
                    "inherit.js": path.join(nodeModules, "inherit.js", "inherit.js"),
                    "underscore-min.js": path.join(nodeModules, "underscore", "underscore-min.js")
                };

                for (var lib in libraries) {
                    if (libraries.hasOwnProperty(lib)) {
                        try {
                            fs.symlinkSync(libraries[lib], path.join(libDir, lib));
                        } catch (e) {
                            console.log(e);
                        }
                    }
                }

                // scaffold files
                var appDir = path.join(publicDir, "app");

                fs.mkdirIfNotExist(appDir);
                fs.mkdirIfNotExist(path.join(appDir, "model"));
                fs.mkdirIfNotExist(path.join(appDir, "view"));
                fs.mkdirIfNotExist(path.join(appDir, "locale"));

                // scaffold index.html
                Helper.template(path.join(__dirname, "templates", "index.html"), path.join(publicDir, "index.html"), {appName: appName});
                // scaffold app/<AppName>.xml
                Helper.template(path.join(__dirname, "templates", "app", "App.xml"), path.join(publicDir, "app", appName + ".xml"), {appName: appName});
                // scaffold app/<AppName>Class.xml
                Helper.template(path.join(__dirname, "templates", "app", "AppClass.js"), path.join(publicDir, "app", appName + "Class.js"), {appName: appName});

                // copy config.json
                Helper.copy(path.join(__dirname, "..", "config.json"), path.join(publicDir, "config.json"));

                console.log("");
                console.log("Application '" + appName + "' in directory '" + publicDir + "' successfully created.");
                console.log("");

            });


        }

    }
}

var cmd = args.shift();
if (cmd == "init" && args.length > 0) {
    init(args[0], args[1]);
} else if (cmd == "postinstall" && args.length == 0) {

    var i = rl.createInterface(process.stdin, process.stdout, null);

    function end() {
        i.close();
        process.stdin.destroy();
    }

    i.question("Create an application? (yes) ", function (answer) {
        if (answer == "" || answer == "yes") {

            var defaultDir = path.normalize(path.join(process.cwd(), "..", ".."));

            flow()
                .seq("dir", function (cb) {
                    i.question("Directory? (" + defaultDir + ") ", function (answer) {
                        cb(null, answer || defaultDir);
                    });
                })
                .seq("name", function (cb) {
                    i.question("Application name? (App) ", function (answer) {
                        cb(null, answer || "App");
                    })
                })
                .seq(function () {
                    // create dir if not available
                    this.vars.dir = path.resolve(this.vars.dir.replace(/^~\//, process.env.HOME + '/'));

                    if (!path.existsSync(this.vars.dir)) {
                        console.log(["dir", this.vars.dir]);
                        fs.mkdirParent(this.vars.dir);
                    }
                })
                .exec(function (err, results) {
                    if (err) {
                        console.log(err);
                    }

                    init(results.name, results.dir);

                    end();

                })
        } else {
            end();
        }
    });
} else {
    var name = process.argv[1].split("/").pop();
    console.log("Usage:");
    console.log(" " + name + " init <AppName> [dir]");
    console.log(" " + name + " update");
}


