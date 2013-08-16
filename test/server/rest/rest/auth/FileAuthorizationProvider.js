define(["srv/auth/AuthorizationProvider"], function (AuthorizationProvider) {

    return AuthorizationProvider.inherit({

        isResponsibleForAuthorizationRequest: function(context, authorizationRequest) {
            return authorizationRequest.$.type === "file";
        },

        _isAuthorized: function(context, authorizationRequest){
            if (context.request.get.parameter.guruMoDe !== "god") {
                throw this.createError("You're not allowed to access this file");
            }
        }

    });

});