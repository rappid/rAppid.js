define(['srv/core/AuthenticationFilter'], function(AuthenticationFilter) {

    return AuthenticationFilter.inherit('srv.filter.SessionAuthenticationFilter', {
        // TODO: store to session

        defaults: {
            sessionKey: "authenticationToken"
        },

        _saveAuthentication: function(context, authentication) {
            if (authentication && authentication.token) {
                context.session.set(this.$.sessionKey, authentication.token);
            } else {
                throw new Error("Authentication token not found");
            }
        }

    });
});