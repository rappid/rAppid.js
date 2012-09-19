define(['js/core/Component', 'srv/core/Handler', 'srv/handler/ExceptionHandler', 'flow', 'srv/core/HttpError'],
    function (Component, Handler, ExceptionHandler, flow, HttpError) {

        return Component.inherit('srv.core.Handlers', {

            ctor: function () {
                this.$handlers = [];
                this.callBase();
            },

            addChild: function (child) {
                if (child instanceof Handler) {
                    this.$handlers.push(child);
                } else {
                    throw new Error("Child for Handlers must be an Handler");
                }

                this.callBase();
            },

            stop: function(callback){
                flow()
                    .seqEach(this.$handlers, function (handler, cb) {
                        // ignore errors during stop
                        handler.stop(function(){
                            cb();
                        });
                    })
                    .exec(callback);
            },
            start: function (server, callback) {

                flow()
                    .seqEach(this.$handlers, function(handler, cb) {
                        handler.start(server, cb);
                    })
                    .exec(callback);

            },

            getRequestHandler: function (context) {
                var ret;

                for (var i = 0; i < this.$handlers.length; i++) {
                    var handler = this.$handlers[i];
                    if (handler instanceof Handler) {
                        try {
                            if (handler.isResponsibleForRequest(context)) {
                                ret = handler.getHandlerInstance();

                                return ret || this.getHandlerForException(
                                    new Error("No handler instance returned for '" + context.request.url + " '."));

                            }
                        } catch (e) {
                            return this.getHandlerForException(e);
                        }
                    }
                }

                return this.getHandlerForException(new HttpError("No handler responsible for '" + context.request.url + " '.", 404));
            },

            getHandlerForException: function (e) {
                if (!(e instanceof Error)) {
                    e = new Error(e);
                }

                return new ExceptionHandler(e);
            }
        })
    });