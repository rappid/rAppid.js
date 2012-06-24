define(["js/core/Window", "js/core/UIComponent", "js/core/History", "js/core/Bus"], function (Window, UIComponent, History, Bus) {

        return Window.inherit("js.core.Application", {
            $classAttributes: [/.+/],
            ctor: function () {
                this.history = new History();

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
             * Starts the application after the application is bootstrapped
             *
             * @param {Object} parameter - parameter configuring the application
             * @param {Function} callback
             */
            start: function (parameter, callback) {
                parameter = parameter || {};
                this.$stage.$parameter = parameter;
                this.show();

                this._startHistory(callback, parameter.initialHash);
            },

            /***
             * Starts the history, which is responsible for navigation
             *
             * @param {Function} [callback] callback function, which is invoked after the history has started
             * @param {String} [initialHash=null] starts the history with this fragment
             * @private
             */
            _startHistory: function(callback, initialHash) {
                this.history.start(callback, initialHash);
            },

            render: function (target) {
                var dom = this.callBase(target);

                this.$stage.$bus.trigger('Application.Rendered');

                return dom;
            }

        });
    }
);