define(['srv/core/Filter', 'require', 'flow', 'js/data/DataSource', 'srv/core/ServerSession', 'srv/core/AuthenticationProvider'],
    function (Filter, require, flow, DataSource, ServerSession, AuthenticationProvider) {

    return Filter.inherit('srv.core.AuthenticationFilter', {

        defaults: {
            authenticationProvider: null
        },

        _start: function (callback) {
            // FIXME
//            if (!this.$.authenticationProvider || !(this.$.authenticationProvider instanceof AuthenticationProvider)) {
//                callback(new Error("AuthenticationProvider not instanceof AuthenticationProvider"));
//            } else {
//                callback();
//            }
            callback();
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
            throw new Error("Not implemented");
        },

        _createAuthenticationRequest: function(context, data){
            context.identity.addAuthorisationRequest(data, this);
        }
    })
});