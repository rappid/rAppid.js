define([], function() {

    return Error.inherit('js.error.ValidationError', {
        ctor: function (message, statusCode, statusText, model) {

            Error.prototype.constructor.call(this, message, statusCode);

            this.message = message;
            this.statusCode = statusCode;
            this.statusText = statusText;
            this.model = model;
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