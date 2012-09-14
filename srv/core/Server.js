define(['js/core/Component', 'srv/core/Context', 'srv/core/Handlers', 'srv/core/EndPoints'],
    function(Component, Context, Handlers, EndPoints) {

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

            // start all end points
            this.$endPoints.start(this, callback);

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
            try {
                // create the new context object
                var context = new Context(endPoint, request, response);
                // and set the chosen handler
                var requestHandler = this.$handlers.getRequestHandler(context);

                context.handler = requestHandler;

                requestHandler.handleRequest(context)

            } catch (e) {
                // TODO: handle error and send response
            }
        }

    });
});