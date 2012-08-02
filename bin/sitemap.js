var http = require('http'),
    url = require('url'),
    _ = require('underscore'),

    extractor = /href=["']#!([^'"]*)/gi,

    sitemap = function (args, callback) {

        var argv,
            paths = ['/'],
            processedPaths = {},
            options;

        argv = require('optimist')(args)
            .usage(sitemap.usage)
            .demand(1)
            .argv;

        var parsedUrl = url.parse(argv._[0]);
        options = {
            method: 'GET',
            host: parsedUrl.hostname,
            port: parsedUrl.port
        };

        work();

        function processPath(path, callback) {

            var option = _.extend({}, options, {
                path: '/?_escaped_fragment_=' + path
            });

            http.get(option, function (res) {
                // TODO: handle redirects

                res.setEncoding('utf8');

                if (res.statusCode === 200) {
                    res.on('data', function (data) {
                        // we got data
                        callback(null, parseAndAddUrls(data));
                    });
                } else {
                    callback(res.statusCode, res);
                }

                res.socket.on('error', function (e) {
                    callback(e);
                });


            }).on('error', function (e) {
                    callback(e);
                });
        }

        function parseAndAddUrls(data) {
            data = data || "";

            var match, path,
                ret = {
                    paths: []
                };

            while (match = extractor.exec(data)) {
                path = match[1];
                ret.paths.push(path);

                if (paths.indexOf(path) === -1) {
                    paths.push(path);
                }
            }

            return ret;
        }

        function work() {
            var path;

            if (paths.length) {
                path = paths.shift();

                if (!processedPaths[path]) {
                    processedPaths[path] = true;

                    console.log("Processing: " + path);

                    processPath(path, function (err, result) {
                        if (err) {
                            console.warn("\tError loading: " + path, err);
                        }

                        processedPaths[path] = result || true;
                        work();
                    });
                } else {
                    work();
                }


            } else {
                callback();
            }
        }

    };

sitemap.usage = "rappidjs sitemap <url>";

module.exports = sitemap;

