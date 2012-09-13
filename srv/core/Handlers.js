define(['js/core/Component', 'srv/core/Handler', 'srv/handler/ExceptionHandler'], function (Component, Handler, ExceptionHandler) {
    return Component.inherit('srv.core.Handlers', {

        getRequestHandler: function(context) {
            var ret;

            for (var i = 0; i < this.$elements.length; i++) {
                var handler = this.$elements[i];
                if (handler instanceof Handler) {
                    try {
                        if (handler.isResponsibleForRequest(context)) {
                            ret = handler.getHandlerInstance();

                            if (!ret) {
                                return this.getHandlerForException(new Error("No handler instance returned for '" + context.request.url + " '." ))
                            }
                        }
                    } catch (e) {
                        return this.getHandlerForException(e);
                    }
                }
            }

            return this.getHandlerForException(new Error("No handler responsible for '" + context.request.url + " '."))
        },

        getHandlerForException: function(e) {
            if (!(e instanceof Error)) {
                e = new Error(e);
            }

            return this.createComponent(ExceptionHandler, {
                exception: e
            });
        }
    })
});