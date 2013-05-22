define(['require', 'path', 'js/core/Component', 'srv/core/Context', 'srv/core/Handlers', 'srv/core/EndPoints', 'srv/core/Filters', 'srv/handler/ExceptionHandler', 'flow', 'domain', 'srv/core/ServerSession', 'srv/core/AuthenticationProviders', 'srv/core/AuthorisationProviders', 'js/lib/extension'],
    function (require, Path, Component, Context, Handlers, EndPoints, Filters, ExceptionHandler, flow, Domain, ServerSession, AuthenticationProviders, AuthorisationProviders, Extension) {

        return Component.inherit('srv.core.Server', {

            defaults: {
                serverSessionClassName: null
            },

            ctor: function () {
                this.$handlers = null;
                this.$filters = null;
                this.$endPoints = null;
                this.$authenticationProviders = null;
                this.$authorisationProviders = null;

                this.callBase();
            },

            addChild: function (child) {
                if (child instanceof Handlers) {
                    this.$handlers = child;
                } else if (child instanceof EndPoints) {
                    this.$endPoints = child;
                } else if (child instanceof Filters) {
                    this.$filters = child;
                } else if (child instanceof AuthenticationProviders) {
                    this.$authenticationProviders = child;
                } else if (child instanceof AuthorisationProviders) {
                    this.$authorisationProviders = child;
                }

                this.callBase();
            },


            _getEnvironment: function () {
                return this.$stage.$environmentName;
            },

            applicationDefaultNamespace: "web",

            supportEnvironments: function () {
                return Path.existsSync(Path.join(this.$stage.$applicationContext.$config.serverRoot, this.applicationDefaultNamespace, "env"));
            },

            start: function (parameter, callback) {

                if (!this.$endPoints) {
                    callback(new Error("No endPoints specified"));
                    return;
                }

                if (!this.$handlers) {
                    callback(new Error("No handlers found"));
                    return;
                }

                if (!this.$filters) {
                    this.addChild(this.createComponent(Filters));
                }

                if (!this.$authenticationProviders) {
                    this.addChild(this.createComponent(AuthenticationProviders));
                }

                if (!this.$authorisationProviders) {
                    this.addChild(this.createComponent(AuthorisationProviders));
                }

                var self = this;

                flow()
                    .seq(function (cb) {
                        if (self.serverSessionClassName) {
                            require([self.serverSessionClassName], function (factory) {
                                if (factory.classof(ServerSession)) {
                                    self.$serverSessionFactory = factory;
                                    cb();
                                } else {
                                    cb("Factory for session not a ServerSession");
                                }

                            }, cb);
                        } else {
                            self.$serverSessionFactory = ServerSession;
                            cb();
                        }
                    })
                    .seq(function (cb) {
                        // start all end points
                        self.$endPoints.start(self, cb);
                    })
                    .seq(function (cb) {
                        // handlers starts also asynchronous to load e.g. classes
                        self.$filters.start(self, cb);
                    })
                    .seq(function (cb) {
                        self.$authenticationProviders.start(self, cb);
                    })
                    .seq(function (cb) {
                        // handlers starts also asynchronous to load e.g. classes
                        self.$handlers.start(self, cb);
                    })
                    .exec(function (err) {
                        if (err) {
                            self.shutdown(function (e) {
                                callback(err);
                            });
                        } else {
                            callback();
                        }
                    });
            },

            /***
             * closes all connections and shuts down the server
             * @param callback
             */
            shutdown: function (callback) {
                var self = this;
                flow()
                    .seq(function (cb) {
                        self.$handlers.stop(function () {
                            // ignore errors during stop
                            cb();
                        });
                    })
                    .seq(function (cb) {
                        self.$authenticationProviders.stop(function () {
                            cb();
                        });
                    })
                    .seq(function (cb) {
                        self.$filters.stop(function () {
                            // ignore errors during stop
                            cb();
                        });
                    })
                    .seq(function (cb) {
                        self.$endPoints.shutdown(function () {
                            // ignore errors during shutdown
                            cb();
                        });
                    })
                    .exec(function (err) {
                        callback && callback(err);

                        process.stdin.end();
                    });
            },

            /***
             * determinate the request handler and routes a request through the server pipeline
             *
             * @param request
             * @param response
             */
            handleRequest: function (endPoint, request, response) {
                var self = this,
                    context,
                    requestHandler,
                    handledWithErrorHandler = false,
                    buffers = [],
                    bufferLength = 0;

                // create a new application domain for the request
                var domain = Domain.create();

                domain.add(request);
                domain.add(response);

                // request.setEncoding('utf8');

                request.on('data', function (chunk) {
                    buffers.push(chunk);
                    bufferLength += chunk.length;
                });

                response.on('close', function () {
                    domain.dispose();
                });

                domain.on('error', handleError);


                request.on('end', function () {

                    request.body = new Buffer(bufferLength);

                    var pos = 0;

                    for (var i = 0; i < buffers.length; i++) {
                        buffers[i].copy(request.body, pos);
                        pos += buffers[i].length;
                    }

                    request.body.content = request.body.toString();

                    buffers = null;

                    domain.run(function () {
                        // create the new context object
                        context = new Context(self, endPoint, request, response);

                        // and set the chosen handler
                        requestHandler = self.$handlers.getRequestHandler(context);
                        context.handler = requestHandler;

                        flow()
                            .seq(function (cb) {
                                context._executeHook("beginRequest", cb);
                            })
                            .seq(function (cb) {
                                if (requestHandler.$.autoStartSession) {
                                    context.session.start(cb);
                                } else {
                                    cb();
                                }
                            })
                            .seq(function (cb) {
                                requestHandler.handleRequest(context, cb);
                            })
                            .exec(function (err) {
                                if (err) {
                                    handleError(err);
                                } else {
                                    context.response.end();
                                }
                            });
                    });
                });

                function handleError(err) {

                    if (!handledWithErrorHandler) {
                        handledWithErrorHandler = true;

                        var exceptionHandler = new ExceptionHandler(err);
                        try {
                            exceptionHandler.handleRequest(context, function (err) {
                                err && handleErrorTheHardWay(err);
                            });
                        } catch (e) {
                            handleErrorTheHardWay(err);
                        }

                    } else {
                        // error handler didn't do the job well
                        handleErrorTheHardWay(err);
                    }
                }

                function handleErrorTheHardWay(error) {

                    console.error(error);

                    try {
                        response.writeHead(500);
                    } catch (error) {
                        console.error('Error sending 500', error, request.url);
                    }

                    response.end('Internal Server Error');
                    domain.dispose();
                }

            }

        }, {
            setupEnvironment: function (ENV, environmentName, applicationDefaultNamespace, callback) {

                var defaultEnvironment,
                    environment;

                flow()
                    .par(function (cb) {

                        require(["json!" + applicationDefaultNamespace + "/env/default"], function (d) {
                            defaultEnvironment = d;
                            cb();
                        }, function (err) {
                            cb(err);
                        });
                    }, function (cb) {
                        if (environmentName) {
                            require(["json!" + applicationDefaultNamespace + "/env/" + environmentName], function (d) {
                                environment = d;
                                cb();
                            }, function (err) {
                                cb(err);
                            });
                        } else {
                            cb();
                        }
                    })
                    .exec(function (err) {
                        ENV.set(_.extend({}, defaultEnvironment, environment));
                        callback && callback(err);
                    });


            }
        });
    });