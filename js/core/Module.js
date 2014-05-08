define(["js/html/HtmlElement", "js/core/Router", "js/core/Head"], function (HtmlElement, Router, Head) {
    return HtmlElement.inherit("js.core.Module", {

        ctor: function() {
            this.callBase();
            this.$routers = [];
        },

        defaults: {
            base: ""
        },

        /**
         * Starts the module. The callback tells the module loader when the module is started.
         *
         * @param {Function} callback
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

        /***
         * notifies the module that it will be removed from the current module loader
         *
         * @param {Function} callback - callback function after the unload has be completed
         * @private
         */
        _unload: function(callback) {
            callback && callback();
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