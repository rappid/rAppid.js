define(['srv/filter/SessionAuthenticationFilter', 'srv/core/AuthenticationRequest'], function(SessionAuthenticationFilter, AuthenticationRequest) {

    return SessionAuthenticationFilter.inherit('srv.filter.CredentialAuthenticationFilter', {

        defaults: {
            usernameParameter: "username",
            passwordParameter: "password",

            sessionKey: "credentialAuthenticationToken"
        },

        /***
         * @abstract
         * @param context
         * @return {Boolean}
         */
        isResponsibleForAuthenticationRequest: function (context) {
            var post = JSON.parse(context.request.body);
            return post.hasOwnProperty(this.$.usernameParameter) && post.hasOwnProperty(this.$.passwordParameter);
        },

        _createAuthenticationRequest: function (context) {
            var post = JSON.parse(context.request.body);
            var authentication = new AuthenticationRequest(this.$.authenticationProvider);
            authentication.setAuthenticationData({
                username: post[this.$.usernameParameter],
                password: post[this.$.passwordParameter]
            });

            return authentication;
        }
    });
});