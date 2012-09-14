var path = require('path'),
    fs = require('fs'),
    requirejs = require('requirejs'),
    _ = require('underscore');

fs.existsSync || (fs.existsSync = path.existsSync);

var server = function (args, callback) {

    var argv = require('optimist')(args)
        .usage(server.usage)
//        .demand(1)
        .argv;

    var serverDirectory = process.cwd(),
        documentRoot = serverDirectory,
        serverFactoryClassName = 'xaml!web/Server',
        configPath = 'config.json';


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

server.usage = "rappidjs server <Directory>";

module.exports = server;

