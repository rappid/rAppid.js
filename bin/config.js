var path = require('path'),
    fs = require('fs'),
    exclude_dirs = ["node_modules", "bin", "doc", "test"],
    rRemoveExtension = /^(.*?)\.[^.]+$/;

var config = function(args, callback) {

    if (args.length  <= 1) {
        var configFile = path.join(".", args[0] || "config.json");

        if (!path.existsSync(configFile)) {
            configFile = path.join(process.cwd(), configFile);
        }

        configFile = path.resolve(configFile);

        // test that we are in the public folder
        var dir = path.dirname(configFile);

        if (path.dirname(dir) !== "public") {
            callback("config will must be created within public directory");
        } else {
            var config = {};

            if (path.existsSync(configFile)) {
                config = JSON.parse(fs.readFileSync(configFile));
            }

            config.xamlClasses = [];
            config.namespaceMap = config.namespaceMap || null;
            config.rewriteMap = config.rewriteMap || null;

            findFiles(dir, exclude_dirs, ["xml"], 0).forEach(function(file){
                // make it relative
                file = path.relative(dir, file);
                // split ext
                file = rRemoveExtension.exec(file)[1].replace(/\//g, ".");

                config.xamlClasses.push(file);
            });

            fs.writeFileSync(configFile, JSON.stringify(config));

            console.log("xamlClasses written to '" + configFile +  "'");
            config.xamlClasses.forEach(function(xaml){
                console.log("\t" + xaml);
            });

        }

    } else {
        callback(true);
    }
};


function findFiles(dir, exclude_dirs, types, dept) {

    var ret = [];

    fs.readdirSync(dir).forEach(function (name) {

        if (exclude_dirs.indexOf(name) === -1 && name.substring(0, 1) !== ".") {
            name = path.join(dir, name);

            var stat = fs.statSync(name);

            if (stat.isDirectory()) {
                ret = ret.concat(findFiles(name, [], types, dept + 1));
            } else if (dept > 0) {

                var ext = path.extname(name).toLowerCase().substring(1);
                if (types.indexOf(ext) !== -1) {
                    ret.push(name);
                }
            }
        }
    });

    return ret;
}

config.usage =  "rappidjs config [file:=config.json]\n" +
                "\tcreates or update the given config.json file to incluce all xaml classes";

module.exports = config;

