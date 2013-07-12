define(['js/core/Component', 'srv/core/HttpError', 'srv/core/Authentication'], function (Component, HttpError, Authentication) {

    return Component.inherit('srv.core.AuthenticationProvider', {

        defaults: {
            name: null
        },

        _initializationComplete: function() {

            if (!this.$.name) {
                throw new Error("Name for authentication provider not set");
            }

            this.callBase();
        },

        start: function (server, callback) {
            this.$server = server;
            this._start(callback);
        },

        _start: function (callback) {
            callback();
        },

        stop: function (callback) {
            callback();
        },

        authenticate: function (authenticationRequest, callback) {
            throw new Error("Abstract implementation");
        },

        isResponsibleForAuthenticationRequest: function (authenticationRequest) {
            return authenticationRequest.$.provider === this.$.name;
        },

        _createAuthenticationError: function(message) {
            return new HttpError(message, 400);
        },

        createAuthentication: function(providerUserId, providerUserData) {
            return new Authentication({
                providerUserId: providerUserId,
                providerUserData: providerUserData,
                provider: this.$.name
            });
        }

    });
});