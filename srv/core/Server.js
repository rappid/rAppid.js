define(['js/core/Component', 'srv/core/Context', 'srv/core/Handlers', 'srv/core/EndPoints', 'srv/handler/ExceptionHandler', 'flow'],
    function(Component, Context, Handlers, EndPoints, ExceptionHandler, flow) {

    return Component.inherit('srv.core.Server', {

        ctor: function() {
            this.$handlers = null;
            this.$endPoints = null;

            this.callBase();
        },

        addChild: function(child) {
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
                .seq(function(cb) {
                    // start all end points
                    self.$endPoints.start(this, cb);
                })
                .seq(function(cb) {
                    // handlers starts also asynchronous to load e.g. classes
                    self.$handlers.start(this, cb);
                })
                .exec(function(err) {
                    if (err) {
                        self.shutdown(callback);
                    } else {
                        callback();
                    }
                })


        },

        /***
         * closes all connections and shuts down the server
         * @param callback
         */
        shutdown: function(callback) {
            this.$endPoints.shutdown(callback);
        },

        /***
         * determinate the request handler and routes a request through the server pipeline
         *
         * @param request
         * @param response
         */
        handleRequest: function(endPoint, request, response) {
            var context,
                requestHandler;

            try {
                // create the new context object
                context = new Context(endPoint, request, response);
                // and set the chosen handler
                requestHandler = this.$handlers.getRequestHandler(context);

                context.handler = requestHandler;

                requestHandler.handleRequest(context);

            } catch (e) {

                try {
                    requestHandler = new ExceptionHandler(e);
                    requestHandler.handleRequest(context);
                } catch (e) {
                    // TODO: log something here
                    console.error(e);
                }

            }
        }

    });
});