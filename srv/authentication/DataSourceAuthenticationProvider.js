define(['srv/core/AuthenticationProvider', 'srv/core/Authentication', 'js/data/Collection', 'require', 'crypto', 'js/data/Model', 'js/data/Query', 'flow'], function (AuthenticationProvider, Authentication, Collection, require, Crypto, Model, Query, flow) {


    return AuthenticationProvider.inherit('srv.core.authentication.DataSourceAuthenticationProvider', {
        defaults: {
            userModelClassName: null,
            dataSource: null,

            algorithm: 'sha1',
            delimiter: ":",
            maxLoginAttempts: 3,

            blockTime: 60 * 60,

            usernameField: "username",
            encryptedPasswordField: "encryptedPassword",
            lastLoginField: "lastLogin",
            loginBlockedField: "loginBlocked",
            loginAttemptsField: "loginAttempts"
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
        createHash: function (password, algorithm, salt) {
            salt = salt || Crypto.randomBytes(128);
            algorithm = algorithm || this.$.algorithm;

            var hash = Crypto.createHash(this.$.algorithm);
            hash.update(salt + password);
            return [algorithm, salt, hash.digest('hex')].join(this.$.delimiter);
        },
        validatePassword: function (password, correctHash) {
            var elements = correctHash.split(this.$.delimiter);
            if (elements.length === 3) {
                return (this.createHash(password, elements[0], elements[1]) === correctHash);
            }
            return false;
        },

        authenticate: function (authenticationRequest, callback) {
            var self = this;

            flow()
                .seq("user", function (cb) {
                    // create query to fetch the user
                    var query = new Query().eql(self.$.usernameField, authenticationRequest.data.username);
                    var collection = this.$.dataSource.createCollection(self.$collectionClass).query(query);
                    collection.fetch(null, function (err, users) {
                        var user;
                        if (!err) {
                            if (users.size()) {
                                user = users.at(0);
                                // check if blocked
                                var blocked = user.get(self.$.loginBlockedField);
                                if (blocked && blocked > new Date().getTime()) {
                                    err = new Error("Please try again later");

                                }
                            }
                        }
                        cb(err, user);
                    });
                })
                .seq("authenticated", function () {
                    // check if user is authenticated
                    var user = this.vars.user;
                    if (user) {
                        var hash = user.get(self.$.encryptedPasswordField);

                        return self.validatePassword(authenticationRequest.data.password, hash);
                    }
                    return false;
                })

                .seq(function (cb) {
                    // check for login attempts if neccessary
                    var user = this.vars.user;
                    if (user && self.$.maxLoginAttempts !== null) {
                        if (this.vars.authenticated) {
                            // if authenticated reset all
                            user.set(self.$.loginAttemptsField, 0);
                            user.set(self.$.loginBlockedField, null);
                            user.save(null, cb);
                        } else {
                            // if not authenticated, increase failed attempts or block him
                            var loginAttempts = user.get(self.$.loginAttemptsField) || 1;
                            if (loginAttempts >= self.$.maxLoginAttempts) {
                                var time = new Date().getTime();
                                time += self.$.blockTime * 1000;
                                user.set(self.$.loginBlockedField, time);
                                user.save(null, cb);
                            } else {
                                user.set(self.$.loginAttemptsField, loginAttempts + 1);
                                user.save(null, cb);
                            }
                        }
                    } else {
                        cb();
                    }
                })
                .exec(function (err, results) {
                    if (err) {
                        callback(err);
                    } else if (!results.authenticated) {
                        callback(self._createAuthenticationError("Wrong username and password."));
                    } else {
                        callback(null, self.createAuthentication(authenticationRequest.data.username, {
                            username: authenticationRequest.data.username
                        }));
                    }
                });
        }

    });
});