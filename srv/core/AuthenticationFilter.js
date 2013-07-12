define(['srv/core/Filter', 'require', 'flow', 'js/data/DataSource', 'srv/core/ServerSession', 'srv/core/AuthenticationProvider'],
    function (Filter, require, flow, DataSource, ServerSession, AuthenticationProvider) {

    return Filter.inherit('srv.core.AuthenticationFilter', {

        /***
         * @abstract
         * @param context
         * @return {Boolean}
         */
        isResponsibleForAuthenticationRequest: function(context) {
            return false;
        },


        authenticateRequestByToken: function(token, context, callback){
            var authService = this.$.authenticationService,
                identityService = this.$.identityService;

            flow()
                .seq("authentication", function (cb) {
                    authService.authenticateByToken(token, cb);
                })
                .seq("identity", function (cb) {
                    identityService.fetchIdentityByAuthentication(this.vars.authentication, cb);
                })
                .exec(function (err, results) {
                    if (!err) {
                        results.identity.set('authentication', results.authentication);
                        context.addIdentity(results.identity);
                    }

                    callback && callback();
                })
        },
        /***
         *
         * @param context
         * @param callback
         */
        handleAuthenticationRequest: function(context, callback) {

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

        _saveAuthentication: function(context, authentication) {
            throw new Error("SaveAuthentication not implemented");
        },

        _createAuthenticationRequest: function(context){
            throw new Error("Not implemented");
        }
    });
});