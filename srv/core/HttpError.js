define([], function() {

    return Error.inherit('srv.core.HttpError', {
        ctor: function(message, statusCode, statusText) {
            message = message || "";
            statusCode = statusCode || 500;

            Error.prototype.constructor.call(this, message, statusCode);

            this.message = message;
            this.statusCode = statusCode;
            this.statusText = statusText;
        },

        _beforeSend: function(context) {
            // hook
        },

        toString: function() {
            var body = this.message,
                stack = this.stack;

            if (stack) {
                body += "<pre>" + stack + "</pre>";
            }

            return body;
        }

    });
});