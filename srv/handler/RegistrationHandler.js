define(['srv/core/Handler', 'srv/core/AuthenticationFilter', 'srv/core/HttpError', 'srv/error/MethodNotAllowedError', 'srv/core/AuthenticationRequest'], function (Handler, AuthenticationFilter, HttpError, MethodNotAllowedError, AuthenticationRequest) {

    return Handler.inherit('srv.handler.SessionHandler', {

        defaults: {
            path: "/api/register",
            userDataSource: null,
            userClassName: null,
            authenticationService: null,
            identityService: null
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

                    // TODO:

                } else {
                    throw new MethodNotAllowedError("Method not supported", ["POST"]);
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