define(["js/core/Component", "flow", "srv/core/Authentication", "js/data/Query", "srv/core/Identity", "js/data/Collectoin"], function (Component, flow, Authentication, Query, Identity, Collection) {


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


    var AuthenticationService = Component.inherit({

        defaults: {
            authenticationProviders: null
        },

        /**
         * Checks token against a database
         *
         * @param token
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
                    callback(err, results.authentication);
                })
        },

        /***
         * Creates an authentication for a authenticationRequest
         *
         * @param authenticationRequest
         */
        authenticateByRequest: function (authenticationRequest, callback) {
            //
            var authProvider = this.$.authenticationProviders.getAuthenticationProviderForRequest(authenticationRequest);
            if (!authProvider) {
                callback(ERROR.NO_PROVIDER_FOUND, null);
            } else {
                // authenticate
                authProvider.authenticate(authenticationRequest, callback);
            }
        },

        /**
         *
         * Returns an identity by authentication
         *
         * @param authentication
         * @param cb
         */
        fetchIdentityByAuthentication: function (authentication, cb) {
            var query = new Query().eql("providerUserId", authentication.$.providerUserId).eql("provider", authentication.$.provider);

            this.$.dataSource.createCollection(Collection.of(Identity)).query(query).fetch(null, function (err, identities) {
                if (!err) {
                    if (identities.isEmpty()) {
                        cb("no identity found")
                    } else {
                        cb(null, identities.at(0));
                    }
                } else {
                    cb(err);
                }
            });
        },

        /***
         * Creates an identity for a userId and authentication
         * @param {String} userId
         * @param {srv.core.Authentication} authentication
         * @param cb  - callback returns error and identity
         */
        createAndSaveIdentity: function (userId, authentication, cb) {

            var identity = this.$.dataSource.createEntity(Identity);

            identity.set({
                userId: userId,
                provider: authentication.$.provider,
                providerUserId: authentication.$.providerUserId
            });

            identity.save(null, cb);
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

    return AuthenticationService;
});