define(['srv/core/AuthenticationProvider', 'srv/core/Authentication', 'js/data/Collection', 'require', 'js/data/Model', 'flow', 'ldapjs'], function (AuthenticationProvider, Authentication, Collection, require, Model, flow, ldap) {

    return AuthenticationProvider.inherit('srv.core.authentication.LDAPAuthenticationProvider', {

        defaults: {
            host: null,
            dnTemplate: 'uid=%username%',
            name: 'ldap'
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

        authenticate: function (authenticationRequest, callback) {
            var username = authenticationRequest.$.username;
            var password = authenticationRequest.$.password;

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
                        callback(null, self.createAuthentication(username, data));
                    } else {
                        callback("Invalid username or password");
                    }
                });

        }

    });
});