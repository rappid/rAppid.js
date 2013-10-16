define(['srv/core/Handler', 'srv/core/AuthenticationService', 'srv/core/HttpError', 'srv/error/MethodNotAllowedError', 'srv/auth/AuthenticationRequest', 'flow', 'JSON', 'srv/auth/AuthenticationError'],
    function (Handler, AuthenticationService, HttpError, MethodNotAllowedError, AuthenticationRequest, flow, JSON, AuthenticationError) {

        return Handler.inherit('srv.handler.AuthenticationHandler', {

            defaults: {
                path: "/api/authentications"
            },

            inject: {
                authenticationService: AuthenticationService
            },

            _createAuthenticationRequest: function (context) {
                var post = JSON.parse(context.request.body);
                return new AuthenticationRequest(post);
            },

            _handleMissingIdentity: function (authentication, cb) {
                cb(AuthenticationError.WRONG_USERNAME_OR_PASSWORD);
            },

            _handleAuthenticationSuccess: function (authentication, cb) {
                this.$.authenticationService.saveAuthentication(authentication, cb);
            },

            handleRequest: function (context, callback) {

                var pathName = context.request.urlInfo.pathname,
                    method = this._getRequestMethod(context);

                var regex = new RegExp(this.$.path.replace(/\//g, "\\/") + "\/" + "([a-fA-F0-9-]+)"),
                    self = this,
                    authService = this.$.authenticationService,
                    match = pathName.match(regex),
                    token = match ? match.pop() : null;


                if (method === "POST") {

                    flow()
                        .seq("authentication", function (cb) {
                            var authRequest = self._createAuthenticationRequest(context);
                            authService.authenticateByRequest(context, authRequest, cb);
                        })
                        .seq("newAuthentication", function (cb) {
                            if (!this.vars.authentication.get('identity')) {
                                self._handleMissingIdentity(this.vars.authentication, cb);
                            } else {
                                self._handleAuthenticationSuccess(this.vars.authentication, cb);
                            }
                        })
                        .exec(function (err, results) {
                            if (!err) {
                                var authentication = results.newAuthentication;

                                var response = context.response,
                                    uri = context.request.urlInfo.uri;

                                response.writeHead(201, {
                                    "Location": uri + "/" + authentication.identifier(),
                                    "Content-Type": "application/json"
                                });

                                var res = {};

                                res[authentication.idField] = authentication.identifier();
                                // TODO: add expire date to payload ...
                                res.data = authentication.get("providerUserData");
                                res.userId = authentication.get('identity').get('userId');
                                response.write(JSON.stringify(res, 2), 'utf8');

                                response.end();
                            } else {
                                var statusCode = 500;
                                switch (err) {
                                    case AuthenticationError.WRONG_USERNAME_OR_PASSWORD:
                                        statusCode = 401;
                                        break;
                                    case AuthenticationError.AUTHENTICATION_EXPIRED:
                                        statusCode = 400;
                                        break;
                                    case AuthenticationError.NO_IDENTITY_FOUND:
                                        statusCode = 301;
                                        break;
                                    case AuthenticationError.TOO_MANY_WRONG_ATTEMPTS:
                                        statusCode = 400;
                                        break;
                                }

                                err = new HttpError(err.errorCode, statusCode)
                            }
                            callback(err);
                        });

                } else if (method === "GET") {
                    // current authentication

                    flow()
                        .seq("authentication", function (cb) {
                            authService.authenticateByToken(context, token, cb);
                        })
                        .exec(function (err, results) {
                            if (!err) {
                                var res = {},
                                    response = context.response;

                                res[results.authentication.idField] = results.authentication.identifier();
                                res.data = results.authentication.get("providerUserData");

                                response.writeHead(200, {
                                    "Content-Type": "application/json"
                                });

                                response.write(JSON.stringify(res, 2), 'utf8');

                                response.end();
                            } else {
                                var statusCode = 500;
                                switch (err) {
                                    case AuthenticationError.AUTHENTICATION_EXPIRED:
                                        statusCode = 400;
                                        break;
                                }

                                err = new HttpError(err.message, statusCode)
                            }

                            callback(err);
                        });

                } else if (method === "DELETE") {
                    authService.deauthenticateToken(token, function (err) {
                        if (!err) {
                            var response = context.response;

                            response.writeHead(200);

                            response.write("", 'utf8');

                            response.end();
                        } else {
                            // TODO
                        }
                        callback(err);
                    });
                } else {
                    throw new MethodNotAllowedError("Method not supported", ["GET", "POST"]);
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