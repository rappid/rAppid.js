define(['srv/core/Handler'], function(Handler) {

    return Handler.inherit('srv.core.ExceptionHandler', {

        ctor: function(exception) {
            if (!(exception instanceof Error)) {
                exception = new Error(exception);
            }

            this.exception = exception;
        },

        isResponsibleForRequest: function() {
            return false;
        },

        handleRequest: function(context) {

            // TODO: display error details only for special user or in special mode

            var response = context.response,
                exception = this.exception || new Error(),
                body, stack;

            body = "<h1>Internal Server Error</h1>" + exception.message;
            stack = exception.stack;

            if (stack) {
                body += "<pre>" + stack + "</pre>";
            }

            response.writeHead(500, 'Internal Server Error', {
                'Content-Length': body.length,
                'Content-Type': 'text/html'
            });

            response.write(body);
            response.end();

        }
    });
});