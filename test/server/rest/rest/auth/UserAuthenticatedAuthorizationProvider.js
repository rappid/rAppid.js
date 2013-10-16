define(["srv/auth/AuthorizationProvider"], function (AuthorizationProvider) {

    return AuthorizationProvider.inherit({

        isResponsibleForAuthorizationRequest: function (context, authorizationRequest) {
            return authorizationRequest.$.type === "RestResource";
        },

        _isAuthorized: function (context, authorizationRequest) {
            return true;
        }

    });

});