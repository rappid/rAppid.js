define(["js/core/UIComponent", "js/core/Router", "js/core/Head"], function (UIComponent, Router, Head) {
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
            if(this.$head){
                this.$head.render();
            }
            if (callback) {
                callback();
            }
        },

        render: function (target) {
            // module won't render anything, but delivers content via js:Content
            // content is rendered inside ContentPlaceHolders
        },

        addChild: function(component) {
            this.callBase();

            if (component instanceof Router) {
                this.$routers.push(component);
            }

            if(component instanceof Head){
               this.$head = component;
            }
        }
    });
});