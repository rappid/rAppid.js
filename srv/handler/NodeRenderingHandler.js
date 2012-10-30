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

            config: 'config.json',

            defaultStartParameter: {}
        },

        start: function(server, callback) {

            var self = this;

            this.$.applicationDirectory = this.$.applicationDirectory ||
                this.$stage.$applicationContext.$config.documentRoot;

            this.$.applicationDirectory = Path.resolve(this.$.applicationDirectory);

            if (!this.$.applicationUrl) {
                for (var i = 0; i < server.$endPoints.$endPoints.length; i++) {
                    var endPoint = server.$endPoints.$endPoints[i];

                    if (endPoint.uri instanceof Function) {
                        this.$.applicationUrl = endPoint.uri();
                        break;
                    }
                }
            }

            flow()
                .seq("config", function(cb) {
                    if (_.isString(self.$.config)) {
                        Fs.readFile(Path.join(self.$.applicationDirectory, self.$.config), function(err, data) {
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
                        self.$applicationContext = results["applicationContext"];
                        self.$html = results["html"];

                        self.log('Starting NodeRenderingHandler with applicationDirectory: ' + self.$.applicationDirectory);
                    }

                    callback(err);
                });

        },

        isResponsibleForRequest: function (context) {
            // see https://developers.google.com/webmasters/ajax-crawling/docs/getting-started
            return context.request.urlInfo.parameter.hasOwnProperty('_escaped_fragment_') &&
                context.request.urlInfo.pathname === this.$.path;
        },

        handleRequest: function(context, callback) {

            var self = this,
                stage;

            flow()
                .seq("window", function () {
                    // generate document
                    var document = JsDom.jsdom(self.$html);
                    return document.createWindow();
                })
                .seq("app", function (cb) {
                    self.$applicationContext.createApplicationInstance(cb.vars.window, function (err, s, application) {
                        stage = s;
                        cb(err, application);
                    });
                })
                .seq(function (cb) {
                    // start application
                    var startParameter = _.extend({}, self.$.defaultStartParameter);
                    startParameter.initialHash = context.request.urlInfo.parameter["_escaped_fragment_"] || "";
                    cb.vars["app"].start(startParameter, cb);
                })
                .seq("html", function () {
                    stage.render(this.vars.window.document.body);
                    return '<!DOCTYPE html>\n' + this.vars.window.document.innerHTML;
                })
                .exec(function (err, results) {


                    if (!err) {
                        context.response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                        context.response.write(results.html);
                        context.response.end();
                    }

                    callback(err);
                });

        }
    });

});