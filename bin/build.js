var path = require('path'),
    requirejs = require('requirejs'),
    rAppid = require(path.join(process.cwd(),'public','js/lib/rAppid.js')).rAppid,
    flow = require('flow.js').flow,
    fs = require('fs');

fs.existsSync || (fs.existsSync = path.existsSync);

var createOnBuildWriteFnc = function(shim){
    return function(moduleName,path, contents){
        if(shim[moduleName]){
            contents = "define('"+moduleName+"', function () { " + contents + "; return "+ shim[moduleName].exports+"; });"
        } else if (moduleName == "rAppid") {
            // rollback content changes
            contents = contents.replace(/EMPTYDEFINE/g, 'define');
        }
        return contents;
    }
};

var optimizeConfig = {
    baseUrl: './public',
    modules: [],
    dir: "public-build",
    optimize: 'uglify',
    optimizeCss: "standard",
    nodeRequire: require,
    findNestedDependencies: false,
    optimizeAllPluginResources: true,
    preserveLicenseComments: false,
    //If using UglifyJS for script optimization, these config options can be
    //used to pass configuration values to UglifyJS.
    //See https://github.com/mishoo/UglifyJS for the possible values.
    uglify: {
        toplevel: true,
        ascii_only: true,
        beautify: false,
        "line-len": 1000
    },
    "paths": {
        "rAppid": "js/lib/rAppid",
        "xaml": "js/plugin/xaml",
        "json": "js/plugin/json",
        "raw": "js/plugin/raw",
        "Query": "js/lib/query/query",
        "flow": "js/lib/flow",
        "inherit": "js/lib/inherit",
        "underscore": "js/lib/underscore",
        "JSON": "js/lib/JSON",
        "moment": "js/lib/moment"
    },
    onBuildRead: function (moduleName, path, contents) {

        if (moduleName == "rAppid") {
            // remove defines, because we don't want dep tracing
            contents = contents.replace(/define/g, 'EMPTYDEFINE');
        }
        return contents;
    },
    skipModuleInsertion: true,
    namespaceMap: rAppid.defaultNamespaceMap,
    rewriteMap: rAppid.defaultRewriteMap
};


var build = function (args, callback) {
    var basePath = process.cwd();

    // read out config.json
    var buildFile = args[0] ||  "build.json";

    var buildConfigPath = path.join(basePath, buildFile);
    var publicPath = path.join(basePath, "public");

    if (!fs.existsSync(buildConfigPath)) {
        callback("Couldn't find build configuration in " + buildConfigPath);
        return;
    }

    if (!fs.existsSync(publicPath)) {
        callback("Couldn't find public dir");
        return;
    }

    var configPath = path.join(publicPath, "config.json");
    if (!fs.existsSync(configPath)) {
        callback("Couldn't find config.json in " + publicPath);
        return;
    }

    var config = JSON.parse(fs.readFileSync(configPath));
    var buildConfig = JSON.parse(fs.readFileSync(buildConfigPath));

    optimizeConfig.onBuildWrite = createOnBuildWriteFnc(config.shim);

    if (buildConfig.uglify === false) {
        optimizeConfig.optimize = 'none';
    }

    optimizeConfig.removeSpaces = buildConfig.removeSpaces || false;

    var xamlClasses = config.xamlClasses;

    // find modules
    var isXamlClass, moduleConfig, mainModule;

    config.optimizedXAML = [];

    buildConfig.modules.forEach(function (module, index) {

        if (typeof module === "string"){
            moduleConfig = {
                name: module,
                create: true,
                include: []
            };
        } else {
            moduleConfig = module;
            moduleConfig.create = true;
            moduleConfig.include = moduleConfig.include || [];
        }
        isXamlClass = xamlClasses.indexOf(moduleConfig.name) > -1;

        if (index === 0) {
            moduleConfig.include = [
                'requireLib',
                'rAppid',
                'inherit',
                'flow',
                'Query',
                'underscore',
                'js/plugin/json',
                'json!config.json',
                'js/lib/parser',
                'js/core/Bus',
                'js/core/Stage',
                'js/core/WindowManager',
                'js/core/InterCommunicationBus',
                'js/core/HeadManager',
                'js/core/Injection',
                'js/core/History'].concat(moduleConfig.include);
        }

        var realModuleName = (isXamlClass ? "xaml!" : "") + moduleConfig.name;
        if (index === 0) {
            mainModule = moduleConfig.name;
        } else {
            moduleConfig.exclude = [mainModule];
        }

        moduleConfig.include.push(realModuleName);

        if(isXamlClass){
            config.optimizedXAML.push(moduleConfig.name);
        }

        optimizeConfig.modules.push(moduleConfig);
    });
    optimizeConfig.xamlClasses = config.xamlClasses;

    for (var key in config.paths){
        if(config.paths.hasOwnProperty(key)){
            if(key !== "JSON"){
                optimizeConfig.paths[key] = config.paths[key];

            }
            if (optimizeConfig.paths[key].indexOf("http") === 0) {
                optimizeConfig.paths[key] = "empty:";
            }
        }
    }

    optimizeConfig.paths["requireLib"] = "js/lib/require";

    optimizeConfig.dir = buildConfig.targetDir || optimizeConfig.dir;

    var versionDir;
    if(buildConfig.usePackageVersion === true){
        var packagePath = path.join(basePath, "package.json"),
            packageContent = JSON.parse(fs.readFileSync(packagePath)),
            version;

        if(packageContent){
            version = versionDir = packageContent.version;
            optimizeConfig.dir = path.join(optimizeConfig.dir,versionDir);
        }else{
            throw new Error("No package.json found");
        }
    }


    var buildDirPath = path.join(basePath,optimizeConfig.dir);
    var newConfigPath = path.join(configPath, "config.json");

    // change config.json
    // set base url
    var realBaseUrl = config.baseUrl;
    if (versionDir) {
        config.baseUrl = path.join(config.baseUrl || ".",versionDir);
    }
    fs.writeFileSync(configPath, JSON.stringify(config));

    var writeBackConfig = function(){
        // write back normal config
        delete config['optimizedXAML'];
        config.baseUrl = realBaseUrl;

        fs.writeFileSync(configPath, JSON.stringify(config));
    };

    global.libxml = require("libxml");

    // start optimizing
    requirejs.optimize(optimizeConfig, function (results) {
        console.log(results);
        // write back normal config
        writeBackConfig();

        var indexFilePath = path.join(buildDirPath, buildConfig.indexFile || "index.html");
        var indexFile = fs.readFileSync(indexFilePath, "utf8");
        var content = String(indexFile);
        content = content.replace(/<script.*?require\.js.*?<\/script>/,"");
        content = content.replace("js/lib/rAppid", mainModule);
        if(versionDir){
            content = content.replace(/(href|src)=(["'])(?!(http|\/\/))([^'"]+)/g,'$1=$2'+versionDir+'/$4');
            content = content.replace(/\$\{VERSION\}/g, version);

            mainModule = path.join(versionDir, mainModule);
            var externalIndexFilePath = path.join(buildDirPath , "..", buildConfig.indexFile || "index.html");
            fs.writeFileSync(externalIndexFilePath, content);
        }
        fs.writeFileSync(indexFilePath, content);
    }, function(err){
        writeBackConfig();

        console.log(err);
    });
};


build.usage = "rappidjs build [build.json]";

module.exports = build;

