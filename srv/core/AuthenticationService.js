define(["js/core/Component", "srv/core/AuthenticationProvider", "flow", "srv/core/Authentication", "js/data/Collection", 'srv/auth/AuthenticationError'], function (Component, AuthenticationProvider, flow, Authentication, Collection, AuthenticationError) {

    var generateId = function () {
        var d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    };

    return Component.inherit({

        defaults: {
            dataSource: null,
            userDataSource: null,
            userModelClassName: null
        },

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

            if (this.$.userModelClassName) {
                this.$.userModelClassName = require(this.$.userModelClassName.replace(/\./g, "/"));
            }

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

        getRegistrationProviderForRequest: function (registrationRequest) {

            var authenticationProviders = this.$providers,
                provider;

            for (var i = 0; i < authenticationProviders.length; i++) {

                provider = authenticationProviders[i];

                if (provider.isResponsibleForRegistrationRequest(registrationRequest)) {
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
                            if (authentication.$.updated.getTime() < now.getTime() - (1000 * 60 * 10)) {
                                // remove token
                                authentication.remove();
                                // return error
                                cb(AuthenticationError.AUTHENTICATION_EXPIRED, null);
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
                flow()
                    .seq("authentication", function (cb) {
                        // authenticate
                        authProvider.authenticate(authenticationRequest, cb);
                    })
                    .seq(function (cb) {
                        // init authentication
                        this.vars.authentication.init(cb);
                    })
                    .exec(function (err, results) {
                        // return authentication with user id
                        callback(err, results.authentication);
                    })
            } else {
                callback(AuthenticationError.NO_PROVIDER_FOUND, null);
            }
        },

        /**
         * Creates a new user instance for a registration request
         * Can be overridden to change how a user is created.
         *
         * @param registrationRequest
         * @returns {*}
         * @private
         */
        _createUserForRegistrationRequest: function (registrationRequest) {
            return this.$.userDataSource.createCollection(Collection.of(this.$.userModelClassName)).createItem();
        },

        registerByRequest: function (registrationRequest, callback) {
            var provider = this.getRegistrationProviderForRequest(registrationRequest);
            if (provider) {
                var userDataSource = this.$.userDataSource,
                    userClass = this.$.userModelClassName,
                    self = this,
                    user,
                    identityService = this.$.identityService;
                flow()
                    // check if user already exists
                    .seq(function (cb) {
                        provider.checkRegistrationRequest(registrationRequest, cb);
                    })
                    // validates the registration request and returns authentication data from the provider
                    .seq("registrationData", function (cb) {
                        provider.loadRegistrationDataForRequest(registrationRequest, cb);
                    })
                    // creates a new user and sets the user data
                    .seq(function () {
                        user = self._createUserForRegistrationRequest(registrationRequest);
                        // TODO: find another way to extend user with data
//                        user.set(registrationRequest.$.userData);
                    })
                    // extends the user with the authentication data
                    .seq(function () {
                        provider.extendUserWithRegistrationData(user, this.vars.registrationData);
                    })
                    // validates and saves user
                    .seq("user", function (cb) {
                        user.validateAndSave(null, cb)
                    })
                    // creates an identity for the user
                    .seq(function (cb) {
                        identityService.createAndSaveIdentity(user.identifier(), provider.$.name, this.vars.registrationData.providerUserId, cb);
                    })
                    .exec(function (err, results) {
                        callback(err, results.user);
                    });
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