define(["srv/auth/AuthorizationProvider"], function (AuthorizationProvider) {

    return AuthorizationProvider.inherit({

        isResponsibleForAuthorizationRequest: function(context, authorizationRequest) {
            return authorizationRequest.$.type === "rest";
        },

        isAuthorized: function(context, authorizationRequest, callback){

        }

    });

});