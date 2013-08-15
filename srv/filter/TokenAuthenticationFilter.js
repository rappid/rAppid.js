define(['srv/auth/AuthenticationFilter', 'flow', 'srv/core/AuthenticationService'], function (AuthenticationFilter, flow, AuthenticationService) {

    return AuthenticationFilter.inherit('srv.filter.TokenAuthenticationFilter', {

        // TODO: store to session
        defaults: {
            identityService: null,
            tokenParameter: "token"
        },

        inject: {
            authenticationService: AuthenticationService
        },

        /***
         *
         * @param context
         * @return {Boolean}
         */
        isResponsibleForRequest: function (context) {
            var parameter = context.request.get.parameter;
            return parameter.hasOwnProperty(this.$.tokenParameter);
        },

        beginRequest: function (context, callback) {
            if(this.isResponsibleForRequest(context)){
                var parameter = context.request.get.parameter;
                this.authenticateRequestByToken(parameter[this.$.tokenParameter], context, callback);
            } else {
                callback();
            }
        }

    });
});