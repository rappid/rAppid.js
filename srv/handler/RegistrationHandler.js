define(['srv/core/Handler', 'srv/auth/AuthenticationFilter', 'srv/core/HttpError', 'srv/error/MethodNotAllowedError', 'srv/core/AuthenticationService', 'srv/auth/RegistrationRequest', 'srv/error/RegistrationError'], function (Handler, AuthenticationFilter, HttpError, MethodNotAllowedError, AuthenticationService, RegistrationRequest, RegistrationError) {

    return Handler.inherit('srv.handler.RegistrationHandler', {

        defaults: {
            path: "/api/register",
            regEx: null,
            userPath: "/api/users"
        },

        inject: {
            authenticationService: AuthenticationService
        },

        _createRegistrationRequest: function (context) {
            var parameter = JSON.parse(context.request.body.content);

            return new RegistrationRequest({
                provider: "dataSource",
                password: parameter.password,
                email: parameter.email
            });
        },

        handleRequest: function (context, callback) {

            var pathName = context.request.urlInfo.pathname,
                method = this._getRequestMethod(context);

            if (method === "POST") {
                var registrationRequest = this._createRegistrationRequest(context),
                    self = this;

                this.$.authenticationService.registerByRequest(registrationRequest, function (err, user) {
                    if (!err) {
                        var response = context.response,
                            uri = context.request.urlInfo.baseUri + self.$.userPath;

                        response.writeHead(201, {
                            'Content-Type': 'application/json; charset=utf-8',
                            'Location': uri + "/" + user.identifier()
                        });

                        var res = {};

                        response.write(JSON.stringify(res, 2), 'utf8');

                        response.end();

                    } else {
                        var statusCode = 500;
                        switch (err) {
                            case RegistrationError.USER_ALREADY_EXISTS:
                                statusCode = 400;
                        }

                        err = new HttpError(err.message, statusCode)
                    }

                    callback(err);
                });

            } else {
                throw new MethodNotAllowedError("Method not supported", ["POST"]);
            }

        },

        /***
         * determinate the request method from the request
         *
         * @param {srv.core.Context} context
         * @return {String} method
         * @private
         */
        _getRequestMethod: function (context) {

            var parameter = context.request.urlInfo.parameter;
            if (parameter.method) {
                return parameter.method.toUpperCase();
            }

            return context.request.method;
        }

    });
});