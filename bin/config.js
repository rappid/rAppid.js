var path = require('path'),
    fs = require('fs'),
    _ = require('underscore'),
    exclude_dirs = ["node_modules", "bin", "doc", "test"],
    rRemoveExtension = /^(.*?)\.[^.]+$/,
    removeXMLSuffix = /^(.*).xml$/,
    backslashes = /\\/g;

    fs.existsSync || (fs.existsSync = path.existsSync);

var config = function(args, callback) {

    if (args.length  <= 1) {
        var configFile = path.resolve(args[0] || "config.json");

        // test that we are in the public folder
        var dir = path.dirname(configFile);

        if (!args[0] && path.basename(dir) !== "public") {
            callback("config must be created within public directory");
        } else {
            var config = {};

            if (fs.existsSync(configFile)) {
                config = JSON.parse(fs.readFileSync(configFile));
            }

            config.xamlClasses = [];
            config.namespaceMap = config.namespaceMap || null;
            config.rewriteMap = config.rewriteMap || null;

            findFiles(dir, exclude_dirs, ["xml"], 0).forEach(function(file){
                // make it relative
                file = path.relative(dir, file);

                file = file.replace(removeXMLSuffix, "$1");
                // issue #19
                file = file.replace(backslashes, "/");

                config.xamlClasses.push(file);
            });

            var moduleConf;
            findConfigs(dir, 0).forEach(function (file) {
                moduleConf = JSON.parse(fs.readFileSync(file));
                for(var key in moduleConf){
                    if(moduleConf.hasOwnProperty(key)){
                        if(config[key]){
                            if(_.isArray(config[key])){
                                _.defaults(config[key], moduleConf[key]);
                            }else{
                                _.extend(config[key], moduleConf[key]);
                            }

                        }else{
                            config[key] = moduleConf[key];
                        }
                    }
                }
            });

            fs.writeFileSync(configFile, JSON.stringify(config, null, 4));



            console.log("xamlClasses written to '" + configFile +  "'");
            config.xamlClasses.forEach(function(xaml){
                console.log("\t" + xaml);
            });
            callback();
        }

    } else {
        callback(true);
    }
};


function findConfigs(dir, dept){
    var ret = [];

    fs.readdirSync(dir).forEach(function (name) {

        if (name.substring(0, 1) !== ".") {
            name = path.join(dir, name);

            var stat = fs.lstatSync(name);

            if(stat.isSymbolicLink()){
                if(dept === 0){
                    ret = ret.concat(findConfigs(path.join(fs.realpathSync(path.join(name, ".")),".."), dept + 1));
                }
            }else if(dept > 0){
                if(path.basename(name) === "config.json"){
                    ret.push(name);
                }

            }
        }
    });

    return ret;

}

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

