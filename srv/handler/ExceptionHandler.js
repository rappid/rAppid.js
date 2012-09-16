define(['srv/core/Handler', 'srv/core/HttpError'], function(Handler, HttpError) {

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
                body, stack,
                statusCode = 500,
                statusText = null;

            if (exception instanceof HttpError) {
                body = exception.toString();
                statusCode = exception.statusCode;
                statusText = exception.statusText;
            } else {
                body = "<h1>Internal Server Error</h1>" + exception.message;

                stack = exception.stack;
                statusText = "Internal Server Error";

                if (stack) {
                    body += "<pre>" + stack + "</pre>";
                }
            }


            response.writeHead(statusCode, statusText, {
                'Content-Length': body.length,
                'Content-Type': 'text/html'
            });

            response.write(body);
            response.end();

        }
    });
});