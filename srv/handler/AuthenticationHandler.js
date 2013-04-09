define(['srv/core/Handler', 'srv/core/AuthenticationFilter', 'srv/core/HttpError', 'srv/error/MethodNotAllowedError'], function (Handler, AuthenticationFilter, HttpError, MethodNotAllowedError) {

    return Handler.inherit('srv.handler.SessionHandler', {

        defaults: {
            path: "/api/authentications"
        },

        isResponsibleForRequest: function (context) {
            var ret = this.callBase(),
                pathName = context.request.urlInfo.pathname;

            return ret && pathName.indexOf(this.$.path) === 0;
        },

        handleRequest: function (context, callback) {

            var pathName = context.request.urlInfo.pathname,
                method = this._getRequestMethod(context);

            if (pathName === this.$.path) {
                // /api/authentication request

                if (method === "POST") {
                    // login
                    var authenticationFilter = this._getAuthenticationFilter(context);

                    if (!authenticationFilter) {
                        throw new HttpError("No responsible authentication filter found.", 500);
                    }
                    authenticationFilter.handleAuthenticationRequest(context, function(err) {
                        if (!err) {
                            var response = context.response;

                            response.writeHead(201, {
                                Location: context.request.urlInfo.uri + "/current"
                            });
                            response.end();
                        } else {
                            callback(err);
                        }
                    });
                } else {
                    throw new MethodNotAllowedError("Method not supported", ["POST"]);
                }
            } else if (pathName === this.$.path + "/current") {
                // current authentication

                if (method === "GET") {
                    var authenticationFilters = this._getAuthenticationFilters();
                    for(var i = 0; i < authenticationFilters.length; i++){
                        var filter = authenticationFilters[i];
                        var authenticationData = context.session.getItem(filter.$.sessionKey);
                        if(authenticationData){
                            var response = context.response;

                            response.writeHead(200, "", {
                                'Content-Type': 'application/json; charset=utf-8'
                            });

                            response.write(JSON.stringify(authenticationData), 'utf8');
                            response.end();
                            return;
                        }
                    }
                    throw new HttpError("Resource not found.", 404);
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
        },

        _getAuthenticationFilter: function (context) {
            var filters = this.$server.$filters.$filters;

            for (var i = 0; i < filters.length; i++) {
                var filter = filters[i];
                if (filter instanceof AuthenticationFilter && filter.isResponsibleForAuthenticationRequest(context)) {
                    return filter;
                }
            }

            return null;
        },

        _getAuthenticationFilters: function(){
            var filters = this.$server.$filters.$filters;
            var ret = [];
            for (var i = 0; i < filters.length; i++) {
                var filter = filters[i];
                if (filter instanceof AuthenticationFilter) {
                    ret.push(filter);
                }
            }
            return ret;
        }

    });
});