define(["js/core/UIComponent", "js/core/Router"], function (UIComponent, Router) {
    return UIComponent.inherit("js.core.Module", {

        ctor: function() {
            this.callBase();
            this.$routers = [];
        },

        /**
         * loads the
         * @param callback
         * @param [routeContext]
         */
        start: function (callback, routeContext) {
            if (callback) {
                callback();
            }
        },

        render: function (target) {
            // module won't render anything, but delivers content via js:Content
            // content is rendered inside ContentPlaceHolders
        },

        addComponent: function(component) {
            this.callBase();

            if (component instanceof Router) {
                this.$routers.push(component);
            }
        }
    });
});