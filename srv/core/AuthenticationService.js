define(["js/core/Component", "srv/core/AuthenticationProvider", "flow", "srv/core/Authentication"], function (Component, AuthenticationProvider, flow, Authentication) {


    var generateId = function () {
        var d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    };

    var ERROR = {
        AUTHENTICATION_EXPIRED: "Authentication expired",
        NO_PROVIDER_FOUND: "No authentication provider found"
    };

    return Component.inherit({

        ctor: function () {
            this.$providers = [];
            this.callBase();
        },

        addChild: function (child) {
            if (child instanceof AuthenticationProvider) {
                this.$providers.push(child);
            } else {
                throw new Error("Child for Providers must be an AuthenticationProvider");
            }

            this.callBase();
        },

        stop: function (callback) {
            flow()
                .seqEach(this.$providers, function (provider, cb) {
                    // ignore errors during stop
                    provider.stop(function () {
                        cb();
                    });
                })
                .exec(callback);
        },

        start: function (server, callback) {

            flow()
                .seqEach(this.$providers, function (provider, cb) {
                    provider.start(server, cb);
                })
                .exec(callback);

        },

        /**
         * Returns the authentication provider for a given request
         *
         * @param authenticationRequest
         * @returns {*}
         */
        getAuthenticationProviderForRequest: function (authenticationRequest) {

            var authenticationProviders = this.$providers,
                provider;

            for (var i = 0; i < authenticationProviders.length; i++) {

                provider = authenticationProviders[i];

                if (provider.isResponsibleForAuthenticationRequest(authenticationRequest)) {
                    return provider;
                }
            }

            return null;

        },

        /**
         * Checks token against a database
         *
         * @param token
         * @param callback
         */
        authenticateByToken: function (token, callback) {
            var authentication = this.$.dataSource.createEntity(Authentication, token);

            flow()
                .seq("authentication", function (cb) {
                    authentication.fetch(null, function (err) {
                        if (!err) {
                            var now = new Date();
                            if (authentication.$.created.getTime() < now.getTime() - (1000 * 60 * 10)) {
                                // remove token
                                authentication.remove();
                                // return error
                                cb(ERROR.AUTHENTICATION_EXPIRED, null);
                            }
                        } else {
                            cb(err);
                        }
                    });
                })
                .seq(function (cb) {
                    if (this.authentication) {
                        this.authentication.save(null, cb);
                    } else {
                        cb();
                    }
                })
                .exec(function (err, results) {
                    callback && callback(err, results.authentication);
                });
        },

        /***
         * Creates an authentication for a authenticationRequest
         *
         * @param authenticationRequest
         * @param callback
         */
        authenticateByRequest: function (authenticationRequest, callback) {
            //
            var authProvider = this.getAuthenticationProviderForRequest(authenticationRequest);

            if (authProvider) {
                // authenticate
                authProvider.authenticate(authenticationRequest, callback);
            } else {
                callback(ERROR.NO_PROVIDER_FOUND, null);
            }
        },

        /**
         * Saves an authentication and adds an token to it
         *
         * @param authentication
         * @param callback
         */
        saveAuthentication: function (authentication, callback) {
            /***
             * Let's save the authentication and so the user is logged in
             *
             */
            var token = generateId();
            var authenticationInstance = this.$.dataSource.createEntity(Authentication, token);

            authenticationInstance.set(authentication.$);
            authenticationInstance.save(null, callback);
        }

    });
});