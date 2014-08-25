define(['js/core/Component', 'srv/core/HttpError', 'srv/auth/Authentication'], function (Component, HttpError, Authentication) {

    return Component.inherit('srv.auth.AuthenticationProvider', {

        defaults: {
            name: null,
            defaultProvider: false
        },

        _initializationComplete: function () {

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

        /**
         * Method to authenticate a request
         * @param authenticationRequest
         * @param callback
         */
        authenticate: function (authenticationRequest, callback) {
            throw new Error("Abstract implementation");
        },

        /**
         * Method to change authentication data
         * @param changeAuthenticationRequest
         * @param callback
         */
        changeAuthentication: function(changeAuthenticationRequest, callback){
            throw new Error("Abstract implementation");
        },

        /***
         *
         * @param authenticationRequest
         * @returns {boolean}
         */
        isResponsibleForAuthenticationRequest: function (authenticationRequest) {
            return authenticationRequest.$.provider === this.$.name || (this.$.defaultProvider === true);
        },

        /**
         *
         * @param registrationRequest
         * @returns {boolean}
         */
        isResponsibleForRegistrationRequest: function (registrationRequest) {
            return registrationRequest.$.provider === this.$.name;
        },

        /**
         * Checks the registration request.
         * For example useful to check if the username or something like this already exists
         *
         * @param registrationRequest
         * @param callback
         */
        checkRegistrationRequest: function (registrationRequest, callback) {
            callback(null);
        },

        /**
         * Loads registration data for the registration request.
         * For example can be used to load facebook user data
         * @param registrationRequest
         * @param callback
         */
        loadRegistrationDataForRequest: function (registrationRequest, callback) {
            callback(null, {});
        },

        /**
         * Extends the user with registration data,
         * For example data from a facebook account.
         *
         * @param user
         * @param registrationData
         */
        extendUserWithRegistrationData: function (user, registrationData) {

        },


        _createAuthenticationError: function (message) {
            return new HttpError(message, 400);
        },

        createAuthentication: function (providerUserId, providerUserData) {

            var authentication = new Authentication({
                providerUserId: providerUserId,
                providerUserData: providerUserData,
                provider: this.$.name
            });

            this.$stage.$bus.setUp(authentication);

            return authentication;
        }


    });
});