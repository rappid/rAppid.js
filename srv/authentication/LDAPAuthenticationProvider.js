define(['srv/core/AuthenticationProvider', 'srv/core/Authentication', 'js/data/Collection', 'require', 'ldapjs', 'js/data/Model'], function (AuthenticationProvider, Authentication, Collection, require, ldap, Model) {


    return AuthenticationProvider.inherit('srv.core.authentication.LDAPAuthenticationProvider', {

        defaults: {
            host: null,
            dnTemplate: 'uid=%username%'
        },

        _authenticateCredentials: function (username, password, callback) {
            if (!this.$client) {
                this.$client = ldap.createClient({
                    url: this.$.host
                });
            }
            // TODO: change test
            if (username && password && /^\w+$/.test(username)) {
                var self = this;

                flow()
                    .seq(function (cb) {
                        self.$client.bind(self.$.dnTemplate.replace("%username%", username), password, function (err) {
                            cb(err);
                        });
                    })
                    .exec(callback);
            } else {
                callback("Authentication failed");
            }
        },

        _authenticateByData: function (authenticationRequest, callback) {
            var username = authenticationRequest.data.username;
            var password = authenticationRequest.data.password;


            var self = this;

            flow()
                .seq(function (cb) {
                    self._authenticateCredentials(username, password, cb);
                })
                .exec(function (err) {
                    if (!err) {
                        var data = {
                            username: username
                        };
                        callback(null, new Authentication(authenticationRequest, data, data, "LDAPAuthToken"));
                    } else {
                        callback("Invalid username or password");
                    }
                });

        },

        _authenticateByToken: function (authenticationRequest, callback) {
            if (authenticationRequest.token === "LDAPAuthToken") {
                callback(null, new Authentication(authenticationRequest, authenticationRequest.data, authenticationRequest.data, "LDAPAuthToken"));
            } else {
                callback && callback("Authentication failed");
            }

        }

    });
});