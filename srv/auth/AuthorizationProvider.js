define(['js/core/Component', "srv/error/AuthorizationError"], function (Component, AuthorizationError) {

    return Component.inherit('srv.auth.AuthorizationProvider', {
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

        /***
         *
         * determinate if the AuthorizationProvider is part of the AuthorizationChain
         * for this request
         *
         * @abstract
         *
         * @param context
         * @param authorisationRequest
         * @returns {boolean}
         */
        isResponsibleForAuthorizationRequest: function (context, authorisationRequest) {
            return true;
        },

        /***
         * @abstract
         *
         * @param context
         * @param authorisationRequest
         * @param callback
         */
        isAuthorized: function (context, authorisationRequest, callback) {

            try {
                this._isAuthorized(context, authorisationRequest);
                callback();
            } catch (e) {
                callback(e);
            }
        },

        _isAuthorized: function (context, authorisationRequest) {
            throw this.createError("Abstract method", authorisationRequest);
        },

        /***
         * creates an AuthorizationError
         *
         * @param message
         * @param authorizationRequest
         * @returns {srv.error.AuthorizationError}
         */
        createError: function (message, authorizationRequest) {
            return new AuthorizationError(message, authorizationRequest);
        }
    });
});