var path = require('path'),
    fs = require('fs'),
    requirejs = require('requirejs'),
    _ = require('underscore');

module.exports = function (options, callback) {

    _.defaults(options, {
        config: "config.json",
        html: "index.html",
        serverFactoryClassName: "xaml!web/Server",

        environment: null,
        serverRoot: null,
        documentRoot: null,

        console: {
            log: function () {
            },
            error: function () {
            }
        }
    });

    var serverRoot = options.serverRoot,
        documentRoot = options.documentRoot,
        configPath = options.config,
        serverFactoryClassName = options.serverFactoryClassName,
        serverInstance;

    var serverModule;
    try {
        serverModule = require(path.join(options.serverRoot, "..", "index.js"));
    } catch(e){
        console.warn("WARN: No index.js for server module defined. Please add a index.js file in the project directory");
    }

    if (path.resolve(configPath) !== configPath) {
        configPath = path.join(serverRoot, configPath);
    }

    var config = {},
        parameter = {},
        projectRequire = (serverModule ? serverModule.require : null),
        rappidRequire = require;

    try {
        _.defaults(config, {
            nodeRequire: function () {
                try {
                    return rappidRequire.apply(rappidRequire, arguments);
                } catch (e) {
                    return projectRequire.apply(projectRequire, arguments);
                }
            },
            baseUrl: serverRoot,
            documentRoot: documentRoot,
            serverRoot: serverRoot
        }, JSON.parse(fs.readFileSync(configPath, 'utf8')));
    } catch (e) {
        console.error(e);
        callback(e);
        return;
    }

    config.suppress = {
        nodeShim: true
    };

    var rAppid = require(path.join(serverRoot, 'js/lib/rAppid.js')).rAppid;

    rAppid.createApplicationContext(null, config, function (err, applicationContext) {
        if (err) {
            callback(err);
        } else {
            var requirejsContext = applicationContext.$requirejsContext;
            applicationContext.$nodeRequire = require;

            requirejsContext([serverFactoryClassName, 'srv/core/Server', 'srv/core/ServerContext', 'js/core/Injection', 'js/core/Bindable'], function (ServerFactory, Server, ServerContext, Injection, Bindable) {

                try {
                    var serverContext = new ServerContext(requirejsContext, applicationContext);
                    serverContext.$environment = new Bindable();

                    var injection = serverContext.$injection = new Injection(null, null, serverContext);
                    injection.addInstance(serverContext.$bus);

                    var server = new ServerFactory(null, false, serverContext, null, null);

                    if (server instanceof Server) {
                        var environmentSetupComplete = function (err) {

                            if (!err) {
                                serverContext.$server = server;
                                server._initialize('auto');
                                server.start(parameter, function (err) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        console.log("server started");
                                        for (var i = 0; i < server.$endPoints.$endPoints.length; i++) {
                                            var endPoint = server.$endPoints.$endPoints[i];

                                            if (endPoint.uri instanceof Function) {
                                                console.log("open " + endPoint.uri() + " in your browser");
                                            }
                                        }
                                        serverInstance = server;
                                        callback(null, serverInstance);
                                    }
                                });
                            } else {
                                callback(err);
                            }

                        };

                        if (options.environment) {
                            Server.setupEnvironment(serverContext.$environment, options.environment, server.applicationDefaultNamespace, environmentSetupComplete);
                        } else if (server.supportEnvironments()) {
                            Server.setupEnvironment(serverContext.$environment, server._getEnvironment(), server.applicationDefaultNamespace, environmentSetupComplete);
                        } else {
                            environmentSetupComplete();
                        }

                    } else {
                        //noinspection ExceptionCaughtLocallyJS
                        throw new Error("Server '" + serverFactoryClassName + "' must be a Server");
                    }
                } catch (e) {
                    callback(e);
                }

            }, function (err) {
                console.error(err);
                callback(err);
            });
        }
    });
}