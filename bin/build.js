var path = require('path'),
    requirejs = require('requirejs'),
    rAppid = require(path.join(process.cwd(),'public','js/lib/rAppid.js')).rAppid,
    jsdom = require('jsdom').jsdom,
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
        "text": 'js/plugins/text',
        "xaml": "js/plugins/xaml",
        "json": "js/plugins/json",
        "raw": "js/plugins/raw",
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
    var buildConfigPath = path.join(basePath, "build.json");
    var publicPath = path.join(basePath, "public");

    if (!path.existsSync(buildConfigPath)) {
        callback("Couldn't find build.json in " + buildConfigPath);
        return;
    }

    if (!path.existsSync(publicPath)) {
        callback("Couldn't find public dir");
        return;
    }

    var configPath = path.join(publicPath, "config.json");
    if (!path.existsSync(configPath)) {
        callback("Couldn't find config.json in " + publicPath);
        return;
    }

    var config = JSON.parse(fs.readFileSync(configPath));
    var buildConfig = JSON.parse(fs.readFileSync(buildConfigPath));

    optimizeConfig.onBuildWrite = createOnBuildWriteFnc(config.shim);

    if (buildConfig.uglify === false) {
        optimizeConfig.optimize = 'none';
    }

    var xamlClasses = config.xamlClasses;

    // find modules
    var isXamlClass, moduleConfig, mainModule;
    buildConfig.modules.forEach(function (module, index) {
        isXamlClass = xamlClasses.indexOf(module) > -1;
        moduleConfig = {
            name: module,
            create: true,
            include: []
        };

        if (index === 0) {
            moduleConfig.include = [
                'rAppid',
                'inherit',
                'flow',
                'underscore',
                'js/plugins/json',
                'js/lib/parser',
                'js/core/Bus',
                'js/core/Stage',
                'js/core/WindowManager',
                'js/core/HeadManager',
                'js/core/Injection'];
        }

        var realModuleName = (isXamlClass ? "xaml!" : "") + module;
        if (index === 0) {
            mainModule = module;
        } else {
            moduleConfig.exclude = [mainModule];
        }

        moduleConfig.include.push(realModuleName);

        if(isXamlClass){
            config.optimizedXAML = config.optimizedXAML || [];
            config.optimizedXAML.push(module);
        }

        optimizeConfig.modules.push(moduleConfig);
    });
    optimizeConfig.xamlClasses = config.xamlClasses;
    optimizeConfig.dir = buildConfig.targetDir || optimizeConfig.dir;

    var buildDirPath = path.join(basePath,optimizeConfig.dir);
    var newConfigPath = path.join(buildDirPath, "config.json");

    global.libxml = require("libxml");

    // start optimizing
    requirejs.optimize(optimizeConfig, function (results) {
        // create build-config
        fs.writeFileSync(newConfigPath, JSON.stringify(config));

        var indexFilePath = path.join(buildDirPath, buildConfig.indexFile || "index.html");
        var indexFile = fs.readFileSync(indexFilePath, "utf8");
        var content = String(indexFile);
        content = content.replace("js/lib/rAppid", mainModule);

        fs.writeFileSync(indexFilePath, content);
    });
};

build.usage = "rappidjs build";

module.exports = build;

