define(['srv/core/AuthenticationProvider', 'srv/core/Authentication', 'js/data/Collection', 'require', 'crypto', 'js/data/Model', 'js/data/Query', 'flow'], function (AuthenticationProvider, Authentication, Collection, require, Crypto, Model, Query, flow) {


    return AuthenticationProvider.inherit('srv.core.authentication.DataSourceAuthenticationProvider', {
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
             * The field which contains the authentication data in a user
             */
            authenticationField: "authentication"
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
            salt = salt || Crypto.randomBytes(128);
            algorithm = algorithm || this.$.algorithm;

            var hash = Crypto.createHash(this.$.algorithm);
            hash.update(salt + password);
            return [algorithm, salt, hash.digest('hex')].join(this.$.delimiter);
        },
        /***
         * Validates a password with a given hash
         * @param password
         * @param correctHash
         * @returns {boolean}
         */
        validatePassword: function (password, correctHash) {
            var elements = correctHash.split(this.$.delimiter);
            if (elements.length === 3) {
                return (this.createHash(password, elements[0], elements[1]) === correctHash);
            }
            return false;
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
         * @param {String} username
         * @param {Function} callback
         */
        fetchUser: function (username, callback) {
            // create query to fetch the user
            var query = this._createQueryForUser(username);
            var collection = this.$.dataSource.createCollection(this.$collectionClass).query(query);
            collection.fetch(null, function (err, users) {
                var user;
                if (!err) {
                    if (users.size()) {
                        user = users.at(0);
                    }
                }
                callback(err, user);
            });
        },

        authenticate: function (authenticationRequest, callback) {
            var self = this;

            flow()
                .seq("user", function (cb) {
                     self.fetchUser(authenticationRequest.data, cb)
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
                        authentication = user.get(self.$.authenticationField);
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
                        err = new Error("Please try again later");
                    }

                    cb(err);
                })
                .seq("authenticated", function () {
                    // check if the password is right for the user
                    var authentication = this.vars.authentication;
                    if (authentication) {
                        var hash = authentication.hash;

                        return self.validatePassword(authenticationRequest.data.password, hash);
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
                            var loginAttempts = authenticationData.loginAttemptsField || 1;
                            if (loginAttempts >= self.$.maxLoginAttempts) {
                                var time = new Date().getTime();
                                time += self.$.blockTime * 1000;
                                authenticationData.loginBlocked = time;
                            } else {
                                authenticationData.loginAttempts = loginAttempts + 1;
                            }
                            user.set(self.$.authenticationField, authenticationData);
                            user.save(null, cb);
                        }
                    } else {
                        cb();
                    }
                })
                .exec(function (err, results) {
                    if (err) {
                        callback(err);
                    } else if (!results.authenticated) {
                        callback(self._createAuthenticationError("Wrong username or password."));
                    } else {
                        callback(null, self.createAuthentication(authenticationRequest.data.username, {
                            username: authenticationRequest.data.username
                        }));
                    }
                });
        }

    });
});