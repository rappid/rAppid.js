define(['js/core/Component'], function (Component) {

    return Component.inherit('srv.core.AuthenticationProvider', {

        start: function(server, callback) {
            this.$server = server;
            this._start(callback);
        },

        _start: function(callback) {
            callback();
        },

        stop: function(callback) {
            callback();
        },

       authenticate: function(authenticationData, callback){
           callback();
       }

    });
});