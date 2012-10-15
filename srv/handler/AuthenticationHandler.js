define(['srv/core/Handler', 'srv/core/AuthenticationFilter', 'srv/core/HttpError'], function (Handler, AuthenticationFilter, HttpError) {

    return Handler.inherit('srv.handler.SessionHandler', {

        isResponsibleForRequest: function (context) {
            var ret = this.callBase();
            return ret && context.request.urlInfo.pathname === this.$.path;
        },

        handleRequest: function (context, callback) {

            var authenticationFilter = this._getAuthenticationFilter(context);

            if (!authenticationFilter) {
                throw new HttpError("No responsible authentication filter found.");
            }

            authenticationFilter.handleAuthenticationRequest(context, callback);
        },

        _getAuthenticationFilter: function (context) {
            var filters = this.$server.$filters.$filters;

            for (var i = 0; i < filters.length; i++) {
                var filter = filters[i];
                if (filter instanceof AuthenticationFilter && filter.isResponsibleForAuthenticationRequest(context)) {
                    return filter;
                }
            }
        }


    });
});