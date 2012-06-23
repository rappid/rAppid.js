define(["js/core/UIComponent", "js/core/History", "js/core/Bus"], function (UIComponent, History, Bus) {

        /***
         * @class js.core.Application
         * @inherit js.core.UIComponent
         */
        return UIComponent.inherit("js.core.Application", {
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
                this.$systemManager.$parameter = parameter;
                this.startHistory(callback, parameter.initialHash);
            },

            startHistory: function(callback, initialHash) {
                this.history.start(callback, initialHash);
            },

            /***
             *
             * @param {Element} [target] the native Element where the rendered element will be appended
             * @return {Element} the rendered Element
             */
            render: function (target) {
                var dom = this.callBase(null);

                if (target) {
                    target.appendChild(dom);
                }

                this.$systemManager.$bus.trigger('Application.Rendered');

                return dom;
            },
            toString: function () {
                return "js.core.Application";
            }
        });
    }
);