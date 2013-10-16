module.exports = create;

create.usage = "\trappidjs create lib <libName> [<dir>] - Creates a rappidjs lib directory structure"
    + "\n\trappidjs create app <AppName> [<dir>] - Creates empty rappidjs application";

var fs = require("fs"),
    path = require("path"),
    flow = require("flow.js").flow,
    ejs = require('ejs'),
    args = process.argv.splice(2),
    install = require(path.join(__dirname, "install.js"));

fs.existsSync || (fs.existsSync = path.existsSync);

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
    },
    copyDirectory: function (srcDir, targetDir, callback) {
        var subDirs = [], files = [];
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
        }
        var source, dest;
        fs.readdirSync(srcDir).forEach(function (name) {

            source = path.join(srcDir, name);
            dest = path.join(targetDir, name);
            var stat = fs.statSync(source);
            if (name.indexOf(".") !== 0) {
                if (stat.isDirectory()) {
                    subDirs.push(name);
                } else if (stat.isFile() || stat.isSymbolicLink()) {
                    files.push({
                        src: source,
                        dst: dest
                    });

                }
            }
        });

        flow()
            .seqEach(files, function (file, cb) {
                var inStr = fs.createReadStream(file.src);
                var outStr = fs.createWriteStream(file.dst);

                inStr.on('end', function () {
                    outStr.end();
                    cb();
                });

                inStr.pipe(outStr);
            })
            .seq(function (cb) {
                if (subDirs.length) {
                    subDirs.forEach(function (dirName) {
                        source = path.join(srcDir, dirName);
                        dest = path.join(targetDir, dirName);

                        Helper.copyDirectory(source, dest, cb);
                    });
                } else {
                    cb();
                }

            })
            .exec(callback);
    }
};

fs.mkdirIfNotExist = function (dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath);
    }
};

fs.mkdirParent = function (dirPath) {
    if (!fs.existsSync(dirPath)) {
        var parentDir = path.normalize(path.join(dirPath, ".."));
        if (!fs.existsSync(parentDir)) {
            fs.mkdirParent(parentDir);
        }

        fs.mkdirSync(dirPath);
    }
};


function createDirectories(directories, where) {
    for (var i = 0; i < directories.length; i++) {
        fs.mkdirIfNotExist(path.join(where, directories[i]));
    }
}

function create(args, callback) {
    if (args.length === 0) {
        callback("No args defined");
    }

    var cmd = args.shift();

    var dir = process.cwd();
    var name = args[0];
    if (args.length > 1) {
        dir = args[1];
    }

    dir = path.resolve(dir.replace(/^~\//, process.env.HOME + '/'));

    if (cmd == "lib" || cmd == "library") {
        createLibrary(name, dir, callback);
    } else if (cmd == "app" || cmd == "application") {
        createApplication(name, dir, callback);
    } else if (cmd === "cls" || cmd == "class") {
        var parentClassName = args.length > 1 ? args[1]: null;
        createClass(name, parentClassName, callback);
    } else {
        callback(true);
    }
}

function createLibrary(libName, dir, callback) {
    dir = dir || process.cwd();

    fs.mkdirParent(dir);

    // create directories
    var dirs = ["bin", "doc", "test", libName, "xsd"];
    createDirectories(dirs, dir);

    Helper.template(path.join(__dirname, "templates", "package.json"), path.join(dir, libName, "package.json"), {name: libName, type: "lib"});
}


function createApplication(appName, dir, callback) {

    dir = dir || process.cwd();

    fs.mkdirParent(dir);

    if (!fs.existsSync(dir)) {
        callback("Directory " + dir + " could not be created");
    }

    if (appName) {
        // create sub directories
        var subDirs = ["bin", "doc", "test", "public", "xsd", "server", "node_modules"];

        // create sub directories
        createDirectories(subDirs, dir);

        // make first character of appName UPPERCASE
        appName = appName.charAt(0).toUpperCase() + appName.substr(1);

        var publicDir = path.join(dir, "public");
        var serverDir = path.join(dir, "server");

        // create app directory in public
        var appDir = path.join(publicDir, "app");
        var webDir = path.join(serverDir, "web");

        fs.mkdirIfNotExist(appDir);
        fs.mkdirIfNotExist(webDir);


        var serverAppDir = path.join(serverDir, "app");
        if (!fs.existsSync(serverAppDir)) {
            var relativePath = path.join(path.relative(serverDir, publicDir), "app");
            fs.symlinkSync(relativePath, serverAppDir, 'dir');
        }

        createDirectories(["collection", "model", "view", "locale", "module"], appDir);
        // do the templating stuff

        // scaffold index.html
        Helper.template(path.join(__dirname, "templates", "index.html"), path.join(publicDir, "index.html"), {appName: appName});

        // scaffold app/<AppName>.xml
        Helper.template(path.join(__dirname, "templates", "app", "App.xml"), path.join(publicDir, "app", appName + ".xml"), {appName: appName});
        // scaffold app/<AppName>Class.xml
        Helper.template(path.join(__dirname, "templates", "app", "AppClass.js"), path.join(publicDir, "app", appName + "Class.js"), {appName: appName});

        Helper.template(path.join(__dirname, "templates", "package.json"), path.join(dir, "package.json"), {name: appName, type: "app"});

        // add server xml
        Helper.template(path.join(__dirname, "templates", "Server.xml"), path.join(webDir, "Server.xml"), {});

        var rappidPath = path.join(fs.realpathSync(process.argv[1]), "../..");

        install(["rAppid.js", "latest", dir], function (err) {
            if (!err) {
                // link config json
                var configPath = path.join(serverDir, "config.json");
                if (!fs.existsSync(configPath)) {
                    var relativePath = path.join(path.relative(serverDir, publicDir), "config.json");
                    fs.symlinkSync(relativePath, configPath);
                }

                // scaffold default app directory structure
                console.log("");
                console.log("Application '" + appName + "' in directory '" + publicDir + "' successfully created.");
                console.log("");
            }
            callback(err)
        });

    }
}

function createClass(fqClassName, fqParentCassName, callback){
    var dir = process.cwd();

    fs.mkdirParent(dir);

    if (!fs.existsSync(dir)) {
        callback("Directory " + dir + " could not be created");
    }

    var packages = fqClassName.split("."),
        className = packages.pop(),
        classDir = path.join(dir, packages.join("/"));

    fs.mkdirParent(classDir);

    if (!fs.existsSync(classDir)) {
        callback("Directory " + classDir + " could not be created");
    }

    fqParentCassName = fqParentCassName || "js.core.Bindable";

    fqParentCassName = fqParentCassName.replace(/\./g,"/");

    var parentClassName = fqParentCassName.split("/").pop();

    // scaffold index.html
    Helper.template(path.join(__dirname, "templates", "Class.js"), path.join(classDir, className+".js"), {parentClassName: parentClassName, fqParentClassName: fqParentCassName, fqClassName: fqClassName});


}