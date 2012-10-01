define(['js/core/Component', 'srv/core/Context', 'srv/core/Handlers', 'srv/core/EndPoints', 'srv/handler/ExceptionHandler', 'flow', 'domain'],
    function (Component, Context, Handlers, EndPoints, ExceptionHandler, flow, Domain) {

        return Component.inherit('srv.core.Server', {

            ctor: function () {
                this.$handlers = null;
                this.$endPoints = null;

                this.callBase();
            },

            addChild: function (child) {
                if (child instanceof Handlers) {
                    this.$handlers = child;
                } else if (child instanceof EndPoints) {
                    this.$endPoints = child;
                }

                this.callBase();
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

                var self = this;

                flow()
                    .seq(function (cb) {
                        // start all end points
                        self.$endPoints.start(self, cb);
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
                    })


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
                        self.$endPoints.shutdown(function () {
                            // ignore errors during shutdown
                            cb();
                        });
                    })
                    .exec(function(err) {
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
                    handledWithErrorHandler = false;

                // create a new application domain for the request
                var domain = Domain.create();

                domain.add(request);
                domain.add(response);

                response.on('end', function () {
                    domain.dispose();
                });

                domain.on('error', handleError);

                domain.run(function () {

                    // create the new context object
                    context = new Context(endPoint, request, response);
                    // and set the chosen handler
                    requestHandler = self.$handlers.getRequestHandler(context);

                    context.handler = requestHandler;

                    requestHandler.handleRequest(context, function(err) {
                        if (err) {
                            handleError(err);
                        }
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
                        response.end('Internal Server Error');
                    } catch (error) {
                        console.error('Error sending 500', error, request.url);
                        domain.dispose();
                    }
                }

            }

        });
    });