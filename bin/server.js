var path = require('path'),
    fs = require('fs'),
    requirejs = require('requirejs'),
    _ = require('underscore'),
    tty = require('tty');

fs.existsSync || (fs.existsSync = path.existsSync);

var serverExport = function (args, callback) {

    var argv = require('optimist')(args)
        .usage(serverExport.usage)
//        .demand(1)
        .argv;

    var serverInstance,
        serverDirectory = process.cwd(),
        documentRoot = serverDirectory,
        serverFactoryClassName = 'xaml!web/Server',
        configPath = 'config.json';

    process.stdin.resume();

//    process.stdin.setRawMode(true);
//    process.stdin.on('keypress', function (char, key) {
//        if (key && key.ctrl && key.name == 'c') {
//            shutdownServer();
//        }
//    });

    process.on('SIGINT', function() {
        shutdownServer();
    });

    process.on('uncaughtException', function (err) {
        console.error(err.stack || err);
    });

    function shutdownServer() {
        if (serverInstance) {
            console.log('Shutting down server... [%d]', process.pid);
            serverInstance.shutdown(function (err) {
                err && console.error(err);
                process.exit(err ? 2 : 0);
            });
        }
    }

    var config = {},
        parameter = {
            port: 8000
        };

    _.defaults(config, {
        nodeRequire: require,
        baseUrl: serverDirectory,

        documentRoot: documentRoot

    }, JSON.parse(fs.readFileSync(configPath, 'utf8')));

    var rAppid = require(path.join(serverDirectory, 'js/lib/rAppid.js')).rAppid;

    rAppid.createApplicationContext(null, config, function(err, applicationContext) {
        if (err) {
            // TODO
            throw err;
        } else {
            var requirejsContext = applicationContext.$requirejsContext;

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

serverExport.usage = "rappidjs server <Directory>";

module.exports = serverExport;

