define(['srv/core/Filter', 'require', 'flow', 'js/data/DataSource', 'srv/core/ServerSession', 'srv/core/AuthenticationProvider'], function (Filter, require, flow, DataSource, ServerSession, AuthenticationProvider) {

    return Filter.inherit('srv.core.AuthenticationFilter', {

        defaults: {
            authenticationProvider: null
        },

        _start: function (callback) {
            if (!(this.$.authenticationProvider instanceof AuthenticationProvider)) {
                callback(new Error("AuthenticationProvider not instanceof AuthenticationProvider"));
            }else{
                callback();
            }
        },

        _createAuthenticationRequest: function(context, data){
            context.identity.addAuthorisationRequest(data, this);
        }
    })
});