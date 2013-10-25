define(['srv/auth/AuthenticationProvider', 'srv/auth/Authentication', 'js/data/Collection', 'require', 'crypto', 'js/data/Model', 'js/data/Query', 'flow', 'srv/auth/AuthenticationError', 'srv/error/RegistrationError'], function (AuthenticationProvider, Authentication, Collection, require, Crypto, Model, Query, flow, AuthenticationError, RegistrationError) {

    return AuthenticationProvider.inherit('srv.auth.DataSourceAuthenticationProvider', {
        defaults: {
            /**
             * The user model className for fetching the User
             */
            userModelClassName: null,
            /**
             * The dataSource for the user
             */
            dataSource: null,
            /**
             * The hashing algorithm
             */
            algorithm: 'sha1',
            /**
             * The delimiter for creating the password hash
             */
            delimiter: ":",
            /**
             * Maximum login attempts for failed logins
             * NULL is unlimited
             */
            maxLoginAttempts: 3,
            /**
             * Block time in seconds
             */
            blockTime: 3600,
            /**
             * The field for fetching the user
             */
            usernameField: "username",
            /**
             * Max. length of passwords
             */
            maxPasswordLength: 60,
            /**
             * The field which contains the authentication data in a user
             */
            authenticationField: "authentication",

            name: "dataSource"
        },

        _start: function (callback) {
            var self = this;

            if (!this.$.dataSource) {
                callback(new Error("No dataSource defined"));
            } else if (!this.$.userModelClassName) {
                callback(new Error("No userModelClassName defined"));
            } else {

                require([this.$.userModelClassName.replace(/\./g, '/')], function (modelFactory) {
                    self.$userModelClass = modelFactory;
                    self.$collectionClass = Collection.of(modelFactory);

                    if (modelFactory.classof(Model)) {
                        callback();
                    } else {
                        callback(new Error("userModelClass must be a Model"));
                    }

                }, function (err) {
                    callback(err);
                });
            }
        },
        /**
         * Creates an hash for a password
         * @param {String} password
         * @param {String} [algorithm] - default sha1
         * @param {String} [salt] - default is generated
         * @returns {String}
         */
        createHash: function (password, algorithm, salt) {
            salt = salt || Crypto.randomBytes(128).toString("hex");
            algorithm = algorithm || this.$.algorithm;

            var hash = Crypto.createHash(this.$.algorithm);
            hash.update(salt + password, "utf8");

            return [algorithm, salt, hash.digest("hex")].join(this.$.delimiter);
        },
        /***
         * Validates a password with a given hash
         * @param password
         * @param correctHash
         * @returns {boolean}
         */
        validatePassword: function (password, correctHash) {
            if (!this.validatePasswordLength(password)) {
                return false;
            }

            var elements = correctHash.split(this.$.delimiter);
            if (elements.length === 3) {
                return (this.createHash(password, elements[0], elements[1]) === correctHash);
            }
            return false;
        },
        validatePasswordLength: function (password) {
            // validate password length
            return !(!password || password.length > this.$.maxPasswordLength || password.length < 0);

        },
        /**
         * Creates an authentication Object which contains all authentication relevant data for an user
         * @param password
         * @param algorithm
         * @param salt
         * @returns {{encryptedPassword: *, loginAttempts: number, loginBlocked: null}}
         */
        createAuthenticationData: function (password, algorithm, salt) {

            return {
                hash: this.createHash(password, algorithm, salt),
                loginAttempts: 0,
                loginBlocked: null
            }

        },
        /**
         * RegistrationRequest requires a password to create the registrationData
         * @param registrationRequest
         * @param cb
         */
        loadRegistrationDataForRequest: function (registrationRequest, cb) {
            if (registrationRequest.$.password) {
                var ret = {
                    providerUserId: registrationRequest.get(this.$.usernameField),
                    authenticationData: this.createAuthenticationData(registrationRequest.$.password)
                };
                cb(null, ret);
            } else {
                cb("No password set");
            }
        },
        /**
         * Checks if the user already exists
         *
         * @param registrationRequest
         * @param callback
         */
        checkRegistrationRequest: function (registrationRequest, callback) {
            this.fetchUser(registrationRequest, function (err, user) {
                if (!err && user) {
                    err = RegistrationError.USER_ALREADY_EXISTS
                }
                callback(err);
            });
        },

        extendUserWithRegistrationData: function (user, registrationData) {
            user.set(this.$.authenticationField, registrationData.authenticationData);
            user.set(this.$.usernameField, registrationData.providerUserId);
        },

        /**
         * Creates a query for fetching a user
         * @param username
         * @returns {*}
         * @private
         */
        _createQueryForUser: function (username) {
            return new Query().eql(this.$.usernameField, username);
        },

        /**
         * Fetches a user by username, returns a User or NULL
         * @param {srv.auth.AuthenticationRequest} authenticationRequest
         * @param {Function} callback
         */
        fetchUser: function (authenticationRequest, callback) {
            // create query to fetch the user
            var query = this._createQueryForUser(authenticationRequest.get(this.$.usernameField));
            var collection = this.$.dataSource.createCollection(this.$collectionClass).query(query);

            collection.fetch({limit: 1}, function (err, users) {
                var user;
                if (!err && users.size()) {
                    user = users.at(0);
                    user.fetch(null, callback);
                } else {
                    callback(err, null);
                }
            });
        },

        changeAuthentication: function (changeAuthenticationRequest, callback) {
            var self = this,
                username = changeAuthenticationRequest.get(this.$.usernameField);

            var data = {};
            data[this.$.usernameField] = username;
            data.password = changeAuthenticationRequest.get("password");

            var newPassword = changeAuthenticationRequest.get('newPassword');

            flow()
                // check authentication
                .seq("authentication", function (cb) {
                    self.authenticate(changeAuthenticationRequest, cb);
                })
                .seq(function () {
                    if (!self.validatePasswordLength(newPassword)) {
                        throw "Not a valid password";
                    }
                })
                // fetch user
                .seq("user", function (cb) {
                    self.fetchUser(changeAuthenticationRequest, cb)
                })
                // create new authentication
                .seq(function (cb) {
                    var user = this.vars.user;
                    var authentication = self.createAuthenticationData(newPassword);
                    user.set(self.$.authenticationField, authentication);
                    user.save(null, cb);
                })
                .exec(callback);
        },

        authenticate: function (authenticationRequest, callback) {
            var self = this,
                username = authenticationRequest.get(self.$.usernameField);

            flow()
                .seq("user", function (cb) {
                    self.fetchUser(authenticationRequest, cb)
                })
                .seq("authentication", function (cb) {
                    // gets the authenticationData
                    var user = this.vars.user,
                        authentication = {
                            loginBlocked: null,
                            loginAttempts: 0,
                            hash: ""
                        };
                    if (user) {
                        authentication = user.get(self.$.authenticationField) || authentication;
                    }
                    cb(null, authentication);

                })
                .seq(function (cb) {
                    // checks if the authentication is blocked
                    var authentication = this.vars.authentication,
                        err = null;
                    // check if blocked
                    var blocked = authentication.loginBlocked;
                    if (blocked && blocked > new Date().getTime()) {
                        err = AuthenticationError.TOO_MANY_WRONG_ATTEMPTS;
                    }

                    cb(err);
                })
                .seq("authenticated", function () {
                    // check if the password is right for the user
                    var authentication = this.vars.authentication;
                    if (authentication) {
                        var hash = authentication.hash;

                        return self.validatePassword(authenticationRequest.$.password, hash);
                    }
                    return false;
                })

                .seq(function (cb) {
                    // check for login attempts if neccessary
                    var user = this.vars.user,
                        authenticationData = this.vars.authentication;
                    if (user && self.$.maxLoginAttempts !== null) {
                        if (this.vars.authenticated) {
                            authenticationData.loginAttempts = 0;
                            authenticationData.loginBlocked = null;
                        } else {
                            // if not authenticated, increase failed attempts or block him
                            var loginAttempts = authenticationData.loginAttempts || 1;
                            if (loginAttempts >= self.$.maxLoginAttempts) {
                                var time = new Date().getTime();
                                time += self.$.blockTime * 1000;
                                authenticationData.loginBlocked = time;
                            } else {
                                authenticationData.loginAttempts = loginAttempts + 1;
                            }
                        }
                        user.set(self.$.authenticationField, authenticationData);
                        user.save(null, cb);
                    } else {
                        cb();
                    }
                })
                .exec(function (err, results) {
                    if (err) {
                        callback(err);
                    } else if (!results.authenticated) {
                        callback(AuthenticationError.WRONG_USERNAME_OR_PASSWORD);
                    } else {
                        var data = {};
                        data[self.$.usernameField] = username;
                        callback(null, self.createAuthentication(username, data));
                    }
                });
        }

    });
});