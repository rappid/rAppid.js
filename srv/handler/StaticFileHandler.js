define(['require', 'srv/core/Handler', 'flow', 'fs', 'path', 'srv/core/HttpError'],
    function (require, Handler, flow, Fs, Path, HttpError) {

        Fs.exists = Fs.exists || Path.exists;

        return Handler.inherit('srv.core.StaticFileHandler', {

            defaults: {
                documentRoot: null,
                indexFile: 'index.html'
            },

            start: function (server, callback) {


                if (!this.$.documentRoot) {
                    this.$.documentRoot = this.$stage.$applicationContext.$config.documentRoot;
                }

                this.$.documentRoot = Path.resolve(this.$.documentRoot);
                this.log('Using document root: ' + this.$.documentRoot);

                callback();
            },

            handleRequest: function (context, callback) {

                var self = this;

                flow()
                    .seq("path", function () {
                        var documentRoot = self.$.documentRoot;

                        var pathName = context.request.urlInfo.pathname;

                        if (pathName === '/') {
                            pathName = self.$.indexFile;
                        }

                        var path = Path.resolve(Path.join(documentRoot, pathName));

                        if (path.indexOf(documentRoot) !== 0) {
                            throw new HttpError("Path outside document root", 403);
                        }

                        return path;
                    })
                    .seq(function (cb) {
                        Fs.exists(this.vars['path'], function (exists) {
                            if (!exists) {
                                cb(new HttpError('File does not exists.', 404));
                            }

                            cb();
                        });
                    })
                    .seq(function () {
                        var stream = Fs.createReadStream(this.vars['path']);

                        stream.on('end', function() {
                            context.response.end();
                        });

                        stream.on('close', function () {
                            context.response.end();
                        });

                        stream.pipe(context.response);
                    })
                    .exec(callback);

            }
        });
    });