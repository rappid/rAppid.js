define(['srv/core/Handler', 'srv/core/AuthenticationService', 'srv/core/HttpError', 'srv/error/MethodNotAllowedError', 'srv/authentication/AuthenticationRequest', 'flow', 'JSON', 'srv/authentication/AuthenticationError'],
    function (Handler, AuthenticationService, HttpError, MethodNotAllowedError, AuthenticationRequest, flow, JSON, AuthenticationError) {

        return Handler.inherit('srv.handler.SessionHandler', {

            defaults: {
                path: "/api/authentications"
            },

            inject: {
                authenticationService: AuthenticationService
            },

            isResponsibleForRequest: function (context) {
                var ret = this.callBase(),
                    pathName = context.request.urlInfo.pathname;

                return ret && pathName.indexOf(this.$.path) === 0;
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
                    authService = this.$.authenticationService;

                if (pathName === this.$.path) {
                    // /api/authentication request

                    if (method === "POST") {

                        flow()
                            .seq("authentication", function (cb) {
                                var authRequest = self._createAuthenticationRequest(context);
                                authService.authenticateByRequest(authRequest, cb);
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

                                    context.user.addAuthentication(authentication);

                                    var response = context.response,
                                        uri = context.request.urlInfo.uri;

                                    response.writeHead(201, {
                                        Location: uri + "/" + authentication.identifier()
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
                                        case AuthenticationError.TOO_MANY_WRONG_ATTEMPTS:
                                            statusCode = 400;
                                            break;
                                    }

                                    err = new HttpError(err.message, statusCode)
                                }
                                callback(err);
                            });
                    } else {
                        throw new MethodNotAllowedError("Method not supported", ["POST"]);
                    }
                } else if (regex.test(pathName)) {
                    // current authentication

                    if (method === "GET") {
                        var match = pathName.match(regex),
                            token = match ? match.pop() : null;


                        flow()
                            .seq("authentication", function (cb) {
                                authService.authenticateByToken(token, cb);
                            })
                            .exec(function (err, results) {
                                if (!err) {
                                    var res = {},
                                        response = context.response;

                                    res[results.authentication.idField] = results.authentication.identifier();
                                    res.data = results.authentication.get("providerUserData");

                                    response.writeHead(200);

                                    response.write(JSON.stringify(res, 2), 'utf8');

                                    response.end();
                                } else {

                                }

                                callback(err);
                            });

//                    var authenticationFilters = this.$.authenticationService.authenticateByToken(token, function(err, authentication){
//                        if(!err){
//
//                        }
//                    });
//                    for (var i = 0; i < authenticationFilters.length; i++) {
//                        var filter = authenticationFilters[i];
//                        var authenticationData = context.session.getItem(filter.$.sessionKey);
//                        if (authenticationData) {
//                            var response = context.response;
//
//                            response.writeHead(200, "", {
//                                'Content-Type': 'application/json; charset=utf-8'
//                            });
//
//                            response.write(JSON.stringify(authenticationData), 'utf8');
//                            response.end();
//                            return;
//                        }
//                    }
//                    throw new HttpError("Resource not found.", 404);
                        // TODO: retrieve authentications
                    } else if (method === "DELETE") {
                        // TODO: logout
                    } else {
                        throw new MethodNotAllowedError("Method not supported", ["GET", "POST"]);
                    }

                } else {
                    throw new HttpError("Resource not found.", 404);
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