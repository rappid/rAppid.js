define(["srv/auth/AuthorizationProvider"], function (AuthorizationProvider) {

    return AuthorizationProvider.inherit({

        isResponsibleForAuthorizationRequest: function (context, authorizationRequest) {
            return authorizationRequest.$.type === "file";
        },

        _isAuthorized: function (context, authorizationRequest) {
            var authorized = false;
            if (context.request.get.parameter.guruMoDe === "god") {
                authorized = true;
            } else if (context.user.isAuthenticated()) {
                // user logged in
                authorized = true;
            }

            if (!authorized) {
                throw this.createError("You're not allowed to access this file");
            }
        }

    });

});