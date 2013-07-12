define(['srv/core/AuthenticationProvider', 'srv/core/Authentication', 'js/data/Collection', 'require', 'crypto', 'js/data/Model'], function (AuthenticationProvider, Authentication, Collection, require, Crypto, Model) {


    return AuthenticationProvider.inherit('srv.core.authentication.DataSourceAuthenticationProvider', {
        defaults: {
            userModelClassName: null,
            idField: 'userId',
            dataSource: null,

            algorithm: 'sha1',
            salt: 'rAppid:js',

            usernameParameter: "username",
            passwordParameter: "password"
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

                }, function(err) {
                    callback(err);
                });
            }
        },

        _cryptPassword: function(password) {
            var algorithm = Crypto.createHash(this.$.algorithm);
            algorithm.update(password);
            return algorithm.digest('hex');
        },

        authenticate: function (authenticationRequest, callback) {
            var self = this;

            var collection = this.$.dataSource.createCollection(this.$collectionClass);
            var where = {};

            where[this.$.usernameParameter] = authenticationRequest.data.username;
            where[this.$.passwordParameter] = this._cryptPassword(authenticationRequest.data.password);

            collection.fetch({
                where: where
            }, function(err) {
                if (err) {
                    callback(err);
                } else if (collection.size() !== 1) {
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