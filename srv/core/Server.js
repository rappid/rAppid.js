define(['js/core/Component', 'http', 'srv/core/Context', 'srv/core/Handlers'], function(Component, http, Context, Handlers) {

    return Component.inherit('srv.core.Server', {

        ctor: function() {
            this.$handlers = null;
            this.callBase();
        },

        addChild: function(child) {
            if (child instanceof Handlers) {
                this.$handlers = child;
            }

            this.callBase();
        },

        start: function (parameter, callback) {
            var self = this;

            callback = callback || function(err) {
                console.err(err);
            };

            parameter = parameter || {
                port: 80
            };

            if (!this.$handlers) {
                callback(new Error("No handlers found"));
                return;
            }

            try {

                http.createServer(function (req, res) {
                    try {
                        var context = new Context(req, res);

                        self.$handlers.getRequestHandler(context);
                    } catch (e) {
                        // TODO: handle
                    }
                }).listen(parameter.port);
            } catch (e) {
                console.error(e);
                callback(e);
            }

        }

    });
});