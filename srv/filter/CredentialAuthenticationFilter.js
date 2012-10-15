define(['srv/core/AuthenticationFilter'], function(AuthenticationFilter) {

    return AuthenticationFilter.inherit('srv.filter.CredentialAuthenticationFilter', {

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

        /***
         *
         * @param context
         * @param callback
         */
        handleAuthenticationRequest: function (context, callback) {
            callback();
        },

        _createAuthenticationRequest: function (context, data) {
            context.identity.addAuthorisationRequest(data, this);
        }
    })
});