rAppid.defineClass("app.components.Test", ["js.core.Component", "app.libs.Api"], function(Component, Api) {
    return Component.inherit({
        ctor: function() {
            this.callBase();
        },
        inject: {
            // we need an API instance which goes to this.$api
            api: Api,
            x: Component
        },
        initialize: function() {
            this.callBase();

            console.log([this.$api, "api"]);
            console.log([this.$x, "x"]);
        }
    });
});