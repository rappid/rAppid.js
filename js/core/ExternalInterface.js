define(["js/core/Base"], function(Base) {

    return Base.inherit('js.core.ExternalInterface', {

        ctor: function(stage) {

            if (!stage) {
                throw new Error("ExternalInterface needs to be injected");
            }

            this.$interface = {};

            // single instance
            if (stage && stage.$externalInterface) {
                return stage.$externalInterface;
            }

            this.$stage = stage;

        },

        addCallback: function(functionName, callback, scope) {
            var scopedCallback = function () {
                var args = Array.prototype.slice.call(arguments);
                return callback.apply(scope, args);
            };

            scopedCallback._async = callback._async;

            this.$interface[functionName] = scopedCallback;

            if (this.runsInBrowser() && this.$stage && this.$stage.$el) {
                // add callback to stage dom element
                this.$stage.$el[functionName] = scopedCallback;
            }
        },

        _stageRendered: function(el) {
            for (var key in this.$interface) {
                if(this.$interface.hasOwnProperty(key)) {
                    el[key] = this.$interface[key];
                }
            }
        }
    });
});