define(['js/core/Base'], function(Base) {
    return Base.inherit('srv.core.AuthenticationRequest', {
        ctor: function(authenticationProvider) {
            this.authenticationProvider = authenticationProvider;
        },

        setAuthenticationData: function (data) {
            this.data = data;
        },

        setToken: function (token) {
            this.token = token;
        },

        isAuthenticationByToken: function() {
            return !!this.token;
        }

    });
});