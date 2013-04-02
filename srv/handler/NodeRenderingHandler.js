define(['srv/core/Handler', 'path', 'flow', 'fs', 'xmldom', 'underscore'], function(Handler, Path, flow, Fs, xmldom, _) {

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
                        });
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
                    var doc = (new xmldom.DOMParser()).parseFromString(indexContent.toString()).documentElement;
                    doc.constructor.prototype.style = {};
                    if(!doc.innerHTML){
                        Object.defineProperty(doc.constructor.prototype, 'innerHTML', {
                            get: function () {
                                return ""; // TODO
                            },
                            set: function(data){
                                var doc = (new xmldom.DOMParser()).parseFromString(data);
                                if(!doc.documentElement){
                                    this.data = data;
                                } else{
                                    while(this.firstChild){
                                        this.removeChild(this.firstChild);
                                    }
                                    this.appendChild(doc.documentElement);
                                }
                            }
                        });
                    }
                    var scripts = doc.getElementsByTagName('script');
                    for(var i = scripts.length-1; i >= 0; i--){
                        var usage = scripts[i].getAttribute("data-usage");
                        if (usage == "bootstrap" || usage == "lib") {
                            scripts[i].parentNode.removeChild(scripts[i]);
                        }
                    }

                    return (new xmldom.XMLSerializer()).serializeToString(doc);
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
                stage,
                now = new Date();

            flow()
                .seq("window", function () {
                    // generate document
                    var document = (new xmldom.DOMParser()).parseFromString(self.$html);
                    return {
                        document: document
                    };

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
                    var initialHash = context.request.urlInfo.parameter["_escaped_fragment_"] || "";

                    if (initialHash instanceof Array) {
                        // _escaped_fragment_ parameter was given more the once
                        initialHash = initialHash[0];
                    }

                    startParameter.initialHash = initialHash;
                    cb.vars["app"].start(startParameter, cb);
                })
                .seq("html", function () {

                    stage.render(this.vars.window.document.getElementsByTagName("body")[0]);
                    return '<!DOCTYPE html>\n' + (new xmldom.XMLSerializer()).serializeToString(this.vars.window.document.documentElement);
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