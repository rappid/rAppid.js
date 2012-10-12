define(['js/core/Base'], function(Base) {

    return Base.inherit('srv.core.Filter', {

        beginRequest: function(context, callback) {
            callback();
        },

        endRequest: function(context, callback) {
            callback();
        }

    });
});