define(['js/core/Component', 'srv/core/HttpError'], function (Component, HttpError) {

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

        authenticate: function (authentication, callback) {
            if (authentication.isAuthenticationByToken()) {
                this._authenticateByToken(authentication, callback);
            } else {
                this._authenticateByData(authentication, callback);
            }
        },

        _authenticateByToken: function (authentication, callback) {
            callback(new Error("AuthenticateByToken not implemented"));
        },

        _authenticateByData: function (authentication, callback) {
            callback(new Error("AuthenticateByData not implemented"));
        },

        _createAuthenticationError: function(message) {
            return new HttpError(message, 400);
        }

    });
});