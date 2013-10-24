define(["srv/core/HttpError"], function (HttpError) {

    var AuthenticationError = HttpError.inherit('srv.authentication.AuthenticationError', {
        ctor: function (message, errorCode, statusCode) {

            this.callBase(message, statusCode, errorCode);

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

    AuthenticationError.WRONG_USERNAME_OR_PASSWORD = new AuthenticationError("Wrong username or password", "wrong_username_or_password", 401);
    AuthenticationError.TOO_MANY_WRONG_ATTEMPTS = new AuthenticationError("Too many wrong login attempts", "too_many_wrong_login_attempts", 401);
    AuthenticationError.AUTHENTICATION_EXPIRED = new AuthenticationError("Authentication expired", "authentication_expired", 401);
    AuthenticationError.NO_PROVIDER_FOUND = new AuthenticationError("No authentication provider found for request", "no_provider_found", 401);
    AuthenticationError.NO_IDENTITY_FOUND = new AuthenticationError("No Identity found!", "no_identity_found", 401);

    return AuthenticationError;
});