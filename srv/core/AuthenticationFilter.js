define(['srv/core/Filter', 'require', 'flow', 'js/data/DataSource', 'srv/core/ServerSession', 'srv/core/AuthenticationProvider'],
    function (Filter, require, flow, DataSource, ServerSession, AuthenticationProvider) {

    return Filter.inherit('srv.core.AuthenticationFilter', {

        defaults: {
            authenticationProvider: null
        },

        _start: function (callback) {
            if (!this.$.authenticationProvider || !(this.$.authenticationProvider instanceof AuthenticationProvider)) {
                callback(new Error("AuthenticationProvider not instanceof AuthenticationProvider"));
            } else {
                callback();
            }
        },

        /***
         * @abstract
         * @param context
         * @return {Boolean}
         */
        isResponsibleForAuthenticationRequest: function(context) {
            return false;
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