define(['srv/core/Handler', 'srv/core/HttpError', 'underscore'], function(Handler, HttpError, _) {

    return Handler.inherit('srv.handler.ExceptionHandler', {

        ctor: function(exception) {

            if (!(exception instanceof Error)) {
                exception = new Error(exception);
            }

            this.exception = exception;
        },

        isResponsibleForRequest: function() {
            return false;
        },

        handleRequest: function(context, callback) {

            // TODO: display error details only for special user or in special mode
            // check authorisation

            var response = context.response,
                exception = this.exception || new Error(),
                body, stack,
                statusCode = 500,
                statusText = null;

            if (exception instanceof HttpError) {
                body = exception.toString();
                statusCode = exception.statusCode;
                statusText = exception.statusText;

                exception._beforeSend(context);

            } else {
                body = "<h1>Internal Server Error</h1>" + exception.message;

                stack = exception.stack;
                statusText = "Internal Server Error";

                if (stack) {
                    body += "<pre>" + stack + "</pre>";
                }
            }

            if(!_.isString(body)) {
                body = body.toString();
            }

            response.writeHead(statusCode, statusText, {
                'Content-Length': body.length,
                'Content-Type': 'text/html'
            });

            response.write(body);
            response.end();

            callback && callback();

        }
    });
});