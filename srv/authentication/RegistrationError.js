define([], function () {

    var RegistrationError = Error.inherit('srv.authentication.RegistrationError', {
        ctor: function (message, errorCode) {

            Error.prototype.constructor.call(this, message, errorCode);

            this.message = message;
            this.errorCode = errorCode;
        },

        toString: function () {
            var body = this.message,
                stack = this.stack;

            if (stack) {
                body += "<pre>" + stack + "</pre>";
            }

            return body;
        }

    });

    RegistrationError.USER_ALREADY_EXISTS = new RegistrationError("User already exists", "user_already_exists");


    return RegistrationError;
});