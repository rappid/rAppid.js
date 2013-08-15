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


        authenticateRequestByToken: function (token, context, callback) {
            var authService = this.$.authenticationService;

            flow()
                .seq("authentication", function (cb) {
                    authService.authenticateByToken(token, cb);
                })
                .exec(function (err, results) {
                    if (!err) {
                        context.user.addAuthentication(results.authentication);
                    }

                    // TODO: pass err object here?
                    callback && callback();
                });
        },
        /***
         *
         * @param context
         * @param callback
         */
        handleAuthenticationRequest: function (context, callback) {

            var self = this,
                authentication = this._createAuthenticationRequest(context);

            this.$.authenticationProvider.authenticate(authentication, function (err, authentication) {
                if (err) {
                    callback(err);
                } else if (!authentication) {
                    callback(new Error("Authenticate without authentication"));
                } else {
                    try {
                        self._saveAuthentication(context, authentication);
                        callback();
                    } catch (e) {
                        callback(e);
                    }
                }
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