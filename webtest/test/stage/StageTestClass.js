define(["js/core/Application", "js/core/ExternalInterface"], function (Application, ExternalInterface) {
    return Application.inherit({

        inject: {
            externalInterface: ExternalInterface
        },

        start: function() {

            var externalInterface = this.$.externalInterface;
            externalInterface.addCallback("test", function (value) {
                window.testValue = value;
            });

            this.callBase();
        }
    });
});
