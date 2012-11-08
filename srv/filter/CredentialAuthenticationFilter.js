define(['srv/filter/SessionAuthenticationFilter', 'srv/core/Authentication'], function(SessionAuthenticationFilter, Authentication) {

    return SessionAuthenticationFilter.inherit('srv.filter.CredentialAuthenticationFilter', {

        defaults: {
            usernameParameter: "username",
            passwordParameter: "password"
        },

        /***
         * @abstract
         * @param context
         * @return {Boolean}
         */
        isResponsibleForAuthenticationRequest: function (context) {
            var post = context.request.post;
            return post.hasOwnProperty(this.$.usernameParameter) && post.hasOwnProperty(this.$.passwordParameter);
        },

        _createAuthenticationRequest: function (context) {
            var post = context.request.post;
            var authentication = new Authentication(this.$.authenticationProvider);
            authentication.setAuthenticationData({
                username: post[this.$.usernameParameter],
                password: post[this.$.passwordParameter]
            });

            return authentication;
        }
    })
});