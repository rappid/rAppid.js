define(['js/core/Component'], function (Base) {

    return Base.inherit('srv.core.Filter', {

        start: function(server, callback) {
            this.$server = server;
            callback();
        },

        stop: function(callback) {
            callback();
        },

        beginRequest: function (context, callback) {
            callback();
        },

        beforeHeadersSend: function (context, callback) {
            callback();
        },

        endRequest: function (context, callback) {
            callback();
        }

    });
});