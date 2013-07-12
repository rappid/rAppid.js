define(['srv/core/AuthenticationFilter', 'flow'], function (AuthenticationFilter, flow) {

    return AuthenticationFilter.inherit('srv.filter.TokenAuthenticationFilter', {

        // TODO: store to session
        defaults: {
            authenticationService: null,
            identityService: null,
            tokenParameter: "token"
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