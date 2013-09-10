define(["js/core/Application", "js/core/ExternalInterface"], function (Application, ExternalInterface) {
    return Application.inherit({

        defaults: {
            name: "application",
            foo: "bar"
        },

        inject: {
            externalInterface: ExternalInterface
        },

        start: function() {

            var self = this;
            var externalInterface = this.$.externalInterface;
            externalInterface.addCallback("test", function (value) {
                self.$stage.testValue = value;
            });

            this.callBase();
        }
    });
});
