define(['srv/core/AuthenticationProvider', 'srv/core/Authentication', 'js/data/Collection', 'require'], function (AuthenticationProvider, Authentication, Collection, require) {


    return AuthenticationProvider.inherit('srv.core.authentication.DataSourceAuthenticationProvider', {
        defaults: {
            userModelClassName: null,
            idKey: 'userId',
            passwordKey: 'password',
            emailKey: 'email',
            dataSource: null
        },

        _start: function (callback) {
            if (!this.$.userModelClassName) {
                callback(new Error("No userModelClassName defined"));
            } else {
                var self = this;
                require(this.$.userModelClassName.replace(/\./g, '/'), function (modelClass) {
                    self.$userModelClass = modelClass;
                    callback();
                });
            }
        },

        authenticate: function (authenticationData, callback) {
            this._fetchUserForAuthenticationData(authenticationData, function (err, user) {
                var authentication;
                if(!err && user){
                    authentication = new Authentication(user, authenticationData);
                }
                callback(err, authentication);
            });
        },
        _fetchUserForAuthenticationData: function (authenticationData, callback) {
            var userId = authenticationData.hasOwnProperty(this.$.idKey);
            if (userId) {
                var user = this.$.dataSource.createEntity(this.$userModelClass, userId);
                user.fetch(null, function (err) {
                    if (!err) {
                        callback(err, user);
                    }
                    callback(err);
                });
                // fetch user with userId
            }else{
                callback();
            }
        }
    });
});