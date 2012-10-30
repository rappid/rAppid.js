var path = require('path'),
    fs = require('fs'),
    requirejs = require('requirejs'),
    _ = require('underscore');

fs.existsSync || (fs.existsSync = path.existsSync);

var serverExport = function (args, callback) {

    process.on('uncaughtException', function (err) {
        console.error(err.stack || err);
    });

    args = args || [];

    var argv = require('optimist')(args)
        .usage("rappidjs server <serverRoot>")
        .demand(1)

        .default('config', 'config.json')
        .default('html', 'index.html')
        .default('serverFactoryClassName', 'xaml!web/Server')

        .describe('config', 'config.json file')
        .describe('serverRoot', 'the root of the server')
        .describe('documentRoot', 'the document root - public')
        .describe('serverFactoryClassName', 'the fqClassName of the factory of the server class')

        .argv;

    var serverInstance,
        serverFactoryClassName = argv.serverFactoryClassName,
        serverRoot,
        documentRoot,
        configPath = argv.config;

    serverRoot = argv._[0].replace(/^~\//, process.env.HOME + '/');
    serverRoot = path.resolve(serverRoot);

    var serverFactoryPath = serverFactoryClassName.replace(/^xaml!/, '') + '.xml';

    if (!fs.existsSync(path.join(serverRoot, serverFactoryPath))) {
        if (fs.existsSync(path.join(serverRoot, 'server', serverFactoryPath))) {
            serverRoot = path.join(serverRoot, 'server');
        }
    }

    if (path.resolve(configPath) !== configPath) {
        configPath = path.join(serverRoot, configPath);
    }

    documentRoot = argv.documentRoot || path.join(serverRoot, '..', 'public');


    console.log("serverRoot: " + serverRoot);
    console.log("DocumentRoot: " + documentRoot);
    console.log("Config: " + configPath);



    function shutdownServer(callback) {
        if (serverInstance) {
            console.log('Shutting down server... [%d]', process.pid);
            serverInstance.shutdown(callback);
        } else {
            callback();
        }
    }

    var config = {},
        parameter = {};

    try {
        _.defaults(config, {
            nodeRequire: require,
            baseUrl: serverRoot,
            documentRoot: documentRoot

        }, JSON.parse(fs.readFileSync(configPath, 'utf8')));
    } catch (e) {
        console.error(e);
        process.exit(3);
    }


    process.stdin.resume();

    process.on('SIGINT', function () {
        shutdownServer(function(err) {
            err && console.error(err);
            process.exit(2);
        });
    });
    var rAppid = require(path.join(serverRoot, 'js/lib/rAppid.js')).rAppid;

    rAppid.createApplicationContext(null, config, function(err, applicationContext) {
        if (err) {
            // TODO
            throw err;
        } else {
            var requirejsContext = applicationContext.$requirejsContext;
            applicationContext.$nodeRequire = require;

            requirejsContext([serverFactoryClassName, 'srv/core/Server', 'srv/core/ServerContext', 'js/core/Injection'], function (ServerFactory, Server, ServerContext, Injection) {

                try {
                    var serverContext = new ServerContext(requirejsContext, applicationContext);

                    var injection = serverContext.$injection = new Injection(null, null, serverContext);
                    injection.addInstance(serverContext.$bus);

                    var server = new ServerFactory(null, false, serverContext, null, null);

                    if (server instanceof Server) {
                        serverContext.$server = server;
                        server._initialize('auto');
                        server.start(parameter, function(err) {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log("server started");
                                for (var i = 0; i < server.$endPoints.$endPoints.length; i++) {
                                    var endPoint = server.$endPoints.$endPoints[i];

                                    if (endPoint.uri instanceof Function) {
                                        console.log("open " + endPoint.uri() + " in your browser");
                                    }
                                }
                                serverInstance = server;
                            }
                        });

                    } else {
                        //noinspection ExceptionCaughtLocallyJS
                        throw new Error("Server '" + serverFactoryClassName + "' must be a Server");
                    }
                } catch (e) {
                    throw e;
                }

            }, function (err) {
                console.error(err);
                process.exit(1);
            })
        }
    });


};

serverExport.usage = function() {
    serverExport();
};

module.exports = serverExport;

