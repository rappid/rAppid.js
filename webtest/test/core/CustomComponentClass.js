define(["js/core/Component"], function (Component) {

    return Component.inherit('test.core.Component', {

        defaults: {
            customAttribute: {}
        },

        inject: {
            injectableAttribute: Component
        }

    });
});