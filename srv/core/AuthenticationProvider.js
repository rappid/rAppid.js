define(['js/core/Component', 'srv/core/HttpError', 'srv/core/Authentication'], function (Component, HttpError, Authentication) {

    return Component.inherit('srv.core.AuthenticationProvider', {

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
            if (authenticationRequest.isAuthenticationByToken()) {
                this._authenticateByToken(authenticationRequest, callback);
            } else {
                this._authenticateByData(authenticationRequest, callback);
            }
        },

        _authenticateByToken: function (authenticationRequest, callback) {
            callback(new Error("AuthenticateByToken not implemented"));
        },

        _authenticateByData: function (authenticationRequest, callback) {
            callback(new Error("AuthenticateByData not implemented"));
        },

        _createAuthenticationError: function(message) {
            return new HttpError(message, 400);
        },

        _createAuthentication: function(user, token) {
            return new Authentication(this, user, token);
        }

    });
});