define(['js/core/Component'], function(Component) {
    return Component.inherit('srv.core.Handler', {

        defaults: {
            route: null
        },

        isResponsibleForRequest: function(context) {
            if (this.$.route !== null) {
                var regex = new RegExp(this.$.route);
                // TODO test route and return
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

        processRequest: function(context, callback) {
            throw new Error("Abstract method processRequest");
        }
    })
});