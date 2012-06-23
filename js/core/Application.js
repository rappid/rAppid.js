define(["js/core/Window", "js/core/UIComponent", "js/core/History", "js/core/Bus"], function (Window, UIComponent, History, Bus) {

        return Window.inherit("js.core.Application", {
            $classAttributes: [/.+/],
            ctor: function () {
                this.history = new History();

                this.callBase();
            },

            initialize: function () {
                // set up application wide vars
                this.callBase();
            },

            _inject: function () {
                // overwrite and call inside start
            },

            _initializeDescriptors: function () {
                this.callBase();
                UIComponent.prototype._inject.call(this);
            },

            /**
             * Method called, when application is initialized
             *
             * @param {Object} parameter
             * @param {Function} callback
             */
            start: function (parameter, callback) {
                parameter = parameter || {};
                this.$stage.$parameter = parameter;
                this.show();

                this.startHistory(callback, parameter.initialHash);
            },

            startHistory: function(callback, initialHash) {
                this.history.start(callback, initialHash);
            },

            render: function (target) {
                var dom = this.callBase(target);

                this.$stage.$bus.trigger('Application.Rendered');

                return dom;
            },
            toString: function () {
                return "js.core.Application";
            }
        });
    }
);