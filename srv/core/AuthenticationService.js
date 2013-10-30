define(["js/core/Component", "srv/auth/AuthenticationProvider", "flow", "srv/auth/Authentication", "js/data/Collection", 'srv/auth/AuthenticationError'], function (Component, AuthenticationProvider, flow, Authentication, Collection, AuthenticationError) {

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
            /**
             * The data source where to store the token
             */
            dataSource: null,
            /**
             * The data source which contains the user
             */
            userDataSource: null,
            /**
             * The User mmodel class name
             */
            userModelClassName: null,
            /**
             * Token life time in seconds
             */
            tokenLifeTime: 600
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
        authenticateByToken: function (context, token, callback) {
            var authentication = this.$.dataSource.createEntity(Authentication, token),
                self = this;

            // setup authentication
            this.$stage.$bus.setUp(authentication);

            flow()
                .seq("authentication", function (cb) {
                    authentication.fetch({noCache: true}, function (err) {
                        if (!err) {
                            var now = new Date();
                            if (authentication.$.updated.getTime() < now.getTime() - (1000 * self.$.tokenLifeTime)) {
                                // remove token
                                authentication.remove();
                                // return error
                                err = AuthenticationError.AUTHENTICATION_EXPIRED;
                            }
                        } else {
                            // TODO: change to authentication not found
                            err = AuthenticationError.AUTHENTICATION_EXPIRED;
                        }

                        cb(err, authentication);
                    });
                })
                .seq(function (cb) {
                    this.vars.authentication.set('updated', new Date());
                    this.vars.authentication.save(null, cb);
                })
                .seq(function (cb) {
                    // init authentication
                    this.vars.authentication.init(cb);
                })
                .exec(function (err, results) {
                    authentication = results.authentication;
                    if (!err && authentication) {
                        context.user.addAuthentication(authentication);
                    }
                    callback && callback(err, authentication);
                });
        },

        deauthenticateToken: function (token, callback) {
            var authentication = this.$.dataSource.createEntity(Authentication, token);

            authentication.remove(null, callback);
        },

        /***
         * Creates an authentication for a authenticationRequest
         *
         * @param authenticationRequest
         * @param callback
         */
        authenticateByRequest: function (context, authenticationRequest, callback) {
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
                        var authentication = results.authentication;
                        if (!err && authentication) {
                            context.user.addAuthentication(authentication);
                        }
                        // return authentication with user id
                        callback(err, authentication);
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
                var self = this,
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
                        user.validateAndSave({upsert: true}, cb)
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


        changeAuthenticationByRequest: function (context, changeAuthenticationRequest, callback) {

            var authProvider = this.getAuthenticationProviderForRequest(changeAuthenticationRequest);

            if (authProvider) {
                flow()
                    // check authentication request
                    .seq("authentication", function (cb) {
                        // change authentication
                        authProvider.changeAuthentication(changeAuthenticationRequest, cb);
                    })
                    .exec(callback)
            } else {
                callback(AuthenticationError.NO_PROVIDER_FOUND, null);
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