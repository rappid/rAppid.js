module.exports = create;

create.usage = "\trappidjs create lib <libName> [<dir>] - Creates a rappidjs lib directory structure"
    + "\n\trappidjs create app <AppName> [<dir>] - Creates empty rappidjs application";

var fs = require("fs"),
    path = require("path"),
    flow = require("flow.js").flow,
    ejs = require('ejs'),
    args = process.argv.splice(2),
    rl = require("readline"),
    install = require(path.join(__dirname, "install.js"));

var Helper = {
    template:function (source, destination, options) {
        var data = fs.readFileSync(source, "utf8");
        fs.writeFileSync(destination, this.render(data, options));

    },
    render:function (string, options) {
        if (options == null) options = {};
        return ejs.render(string, options);
    },
    copy:function (source, destination) {
        var data = fs.readFileSync(source, "utf8");
        fs.writeFileSync(destination, data);
    }
};

fs.mkdirIfNotExist = function (dirPath) {
    if (!path.existsSync(dirPath)) {
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


function createDirectories(directories, where){
    for (var i = 0; i < directories.length; i++) {
        fs.mkdirIfNotExist(path.join(where, directories[i]));
    }
}

function create(args, callback){
    if(args.length === 0){
        callback("No args defined");
    }
    var cmd = args.shift();

    var dir = process.cwd();
    var name = args.shift();
    if(args.length > 0){
        dir = args.shift();
    }

    dir = path.resolve(dir.replace(/^~\//, process.env.HOME + '/'));

    if(cmd == "lib" || cmd == "library"){
        createLibrary(name,dir,callback);

    }else if(cmd == "app" || cmd == "application"){
        createApplication(name,dir,callback);
    }
}

function createLibrary(libName, dir, callback) {
    dir = dir || process.cwd();

    fs.mkdirParent(dir);

    // create directories
    var dirs = ["bin", "doc", "test", libName, "xsd"];
    createDirectories(dirs,dir);


}


function createApplication(appName, dir, callback) {

    dir = dir || process.cwd();

    fs.mkdirParent(dir);

    if (!path.existsSync(dir)) {
        callback("Directory " + dir + " could not be created");
    }

    if (appName) {
        // create sub directories
        var subDirs = ["bin", "doc", "test", "public", "xsd"];

        // create sub directories
        createDirectories(subDirs,dir);

        // make first character of appName UPPERCASE
        appName = appName.charAt(0).toUpperCase() + appName.substr(1);

        var publicDir = path.join(dir, "public");

        // create app directory in public
        var appDir = path.join(publicDir, "app");

        fs.mkdirIfNotExist(appDir);

        createDirectories(["model","view","locale"],appDir);
        // do the templating stuff

        // scaffold index.html
        Helper.template(path.join(__dirname, "templates", "index.html"), path.join(publicDir, "index.html"), {appName:appName});
        // scaffold app/<AppName>.xml
        Helper.template(path.join(__dirname, "templates", "app", "App.xml"), path.join(publicDir, "app", appName + ".xml"), {appName:appName});
        // scaffold app/<AppName>Class.xml
        Helper.template(path.join(__dirname, "templates", "app", "AppClass.js"), path.join(publicDir, "app", appName + "Class.js"), {appName:appName});


        // TODO: add interactive mode
        install(["rAppid.js", "latest", dir], function (err) {
            if (!err) {

                // scaffold default app directory structure
                console.log("");
                console.log("Application '" + appName + "' in directory '" + publicDir + "' successfully created.");
                console.log("");
            } else {
                callback(err);
            }
        });
    }
}