define(["js/core/UIComponent"], function (UIComponent) {
    return UIComponent.inherit("js.core.Module", {
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
        }
    });
});