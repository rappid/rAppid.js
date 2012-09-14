define(['js/core/Component'], function(Component) {
    return Component.inherit('srv.core.Handler', {

        defaults: {
            route: null
        },

        isResponsibleForRequest: function(context) {
            if (this.$.route !== null) {
                return (new RegExp(this.$.route, "i")).test(context.request.urlInfo.pathname);
            }

            return false;
        },

        /***
         * returns an handler instance to process the request
         * @return {srv.core.Handler}
         */
        getHandlerInstance: function() {
            return this;
        },

        /***
         * handles the request
         * @param {srv.core.ServerContext} context
         */
        handleRequest: function(context) {
            throw new Error("Abstract method processRequest");
        }
    })
});