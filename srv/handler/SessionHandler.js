define(['srv/core/Handler'], function(Handler) {

    return Handler.inherit('srv.handler.SessionHandler', {

        isResponsibleForRequest: function(context) {
            var ret = this.callBase();
            return ret && context.request.urlInfo.pathname === this.$.path;
        },

        handleRequest: function(context) {

        }
    });
});