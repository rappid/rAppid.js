define(['srv/core/Filter', 'require', 'flow'], function (Filter, require, flow) {

    return Filter.inherit('srv.auth.AuthenticationFilter', {

        /***
         * @abstract
         * @param context
         * @return {Boolean}
         */
        isResponsibleForAuthenticationRequest: function (context) {
            return false;
        },


        authenticateRequestByToken: function (context, token, callback) {
            var authService = this.$.authenticationService;

            flow()
                .seq("authentication", function (cb) {
                    authService.authenticateByToken(context, token, cb);
                })
                .exec(function (err, results) {
                    if (!err) {
                        context.user.addAuthentication(results.authentication);
                    }

                    // TODO: pass err object here?
                    callback && callback();
                });
        },

        _saveAuthentication: function (context, authentication) {
            throw new Error("SaveAuthentication not implemented");
        },

        _createAuthenticationRequest: function (context) {
            throw new Error("Not implemented");
        }
    });
});