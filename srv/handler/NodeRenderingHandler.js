define(['srv/core/Handler', 'path', 'flow', 'fs', 'jsdom', 'underscore'], function(Handler, Path, flow, Fs, JsDom, _) {

    return Handler.inherit('srv.handler.NodeRenderingHandler', {

        defaults: {
            // used for making ajax relative ajax requests - null indicates that it is hosted on this server
            applicationUrl: null,

            // the document root will be used by default
            applicationDirectory: null,
            options: null,

            application: 'app/App.xml',

            indexFile: 'index.html',

            config: 'config.json'
        },

        start: function(server, callback) {

            var self = this;

            this.$.applicationDirectory = this.$.applicationDirectory ||
                this.$stage.$applicationContext.$config.documentRoot;

            this.$.applicationDirectory = Path.resolve(this.$.applicationDirectory);

            if (!this.$.applicationUrl) {
                for (var i = 0; i < server.$endPoints.length; i++) {
                    var endPoint = server.$endPoints[i];

                    if (endPoint.uri instanceof Function) {
                        this.$.applicationUrl = endPoint.uri();
                        break;
                    }
                }
            }

            flow()
                .seq("config", function(cb) {
                    if (_.isString(self.$.config)) {
                        Fs.readFile(Path.join(self.$.applicationDir, self.$.config), function(err, data) {
                            if (!err) {
                                data = JSON.parse(data);
                                data.nodeRequire = require;
                                data.baseUrl = self.$.applicationDirectory;
                                data.applicationUrl = self.$.applicationUrl;
                            }
                            cb(err, data);
                        })
                    } else {
                        cb(null, self.$.config);
                    }
                })
                .seq("applicationContext", function (cb) {
                    // create an application context
                    // TODO: create in own requirejs context -> we need a context name
                    var require = self.$stage.$applicationContext.$nodeRequire;
                    var rAppid = require(Path.join(self.$.applicationDirectory, 'js', 'lib', 'rAppid')).rAppid;
                    rAppid.createApplicationContext(self.$.application, cb.vars['config'], cb);
                })
                .seq("html", function () {
                    var indexContent = Fs.readFileSync(Path.join(self.$.applicationDirectory, self.$.indexFile));

                    // clean up html
                    var doc = JsDom.jsdom(indexContent);

                    var scripts = doc.getElementsByTagName('script');
                    scripts._snapshot.forEach(function (script) {
                        var usage = script.getAttribute("data-usage");
                        if (usage == "bootstrap" || usage == "lib") {
                            script.parentNode.removeChild(script);
                        }
                    });

                    return doc.innerHTML;
                })
                .exec(function(err, results) {

                    if (!err) {
                        self.$.applicationContext = results.applicationContext;
                        self.$.html = results.html;

                        self.log('Starting NodeRenderingHandler with applicationDirectory: ' + self.$.applicationDirectory);
                    }

                    callback(err);
                });

        },

        isResponsibleForRequest: function (context) {
            // see https://developers.google.com/webmasters/ajax-crawling/docs/getting-started
            return context.request.urlInfo.parameter.hasOwnProperty('_escaped_fragment_');
        },

        handleRequest: function(context, callback) {

        }
    });

});