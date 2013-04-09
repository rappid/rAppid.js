define(['js/core/Base'], function(Base) {
    return Base.inherit('srv.core.Authentication', {
        ctor: function(authenticationRequest, user, data, token) {
            this.authenticationRequest = authenticationRequest;
            this.authenticationProvider = authenticationRequest.authenticationProvider;

            this.user = user;
            this.data = data;
            this.token = token;
        }

    });
});