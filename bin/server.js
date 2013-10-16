var path = require('path'),
    fs = require('fs'),
    requirejs = require('requirejs'),
    _ = require('underscore'),
    server = require('./lib/server.js');

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

        .describe('environment', 'explicit set an environment')
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

    process.stdin.resume();

    server({
        config: configPath,
        html: argv.html,
        serverFactoryClassName: argv.serverFactoryClassName,

        environment: argv.environment,
        serverRoot: serverRoot,
        documentRoot: documentRoot,
        console: console
    }, function(err, instance) {

        if (err) {
            console.error(err);
            process.exit(3);
        } else {
            serverInstance = instance;
        }
    });

    process.on('SIGINT', function () {
        shutdownServer(function(err) {
            err && console.error(err);
            process.exit(2);
        });
    });

    function shutdownServer(callback) {
        if (serverInstance) {
            console.log('Shutting down server... [%d]', process.pid);
            serverInstance.shutdown(callback);
        } else {
            callback();
        }
    }
};

serverExport.usage = function() {
    serverExport();
};

module.exports = serverExport;

