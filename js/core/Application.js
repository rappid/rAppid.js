define(["js/core/Window", "js/html/HtmlElement", "js/lib/extension", "underscore", "require", "flow", "js/core/Bindable"], function (Window, HtmlElement, Extension, _, require, flow, Bindable) {

        /***
         * An application is a Window, which gets bootstrapped and started by rAppid.js and is attached to the WindowManager.
         *
         * @see js.core.WindowManager
         */
        return Window.inherit("js.core.Application", {
            $classAttributes: [/.+/],
            ctor: function () {
                this.callBase();
            },

            defaults: {
                ENV: null
            },

            _inject: function () {
                // overwrite and call inside start
            },

            _initializeDescriptors: function () {
                this.callBase();
                HtmlElement.prototype._inject.call(this);
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
                this.$stage.$environmentName = parameter.environment;
                this.show();

                this._startHistory(callback, parameter.initialHash);
            },

            _getEnvironment: function() {
                return this.$stage.$environmentName;
            },

            applicationDefaultNamespace: "app",

            supportEnvironments: false,

            /***
             * Starts the history, which is responsible for navigation
             *
             * @param {Function} [callback] callback function, which is invoked after the history has started
             * @param {String} [initialHash=null] starts the history with this fragment
             * @private
             */
            _startHistory: function(callback, initialHash) {
                this.$stage.$history.start(callback, initialHash);
            },

            /***
             *
             * @param {Element} [target] the native Element where the rendered element will be appended
             * @return {Element} the rendered Element
             */
            render: function (target) {
                var dom = this.callBase(target);

                this.$stage.$bus.trigger('Application.Rendered');

                return dom;
            }

        }, {

            setupEnvironment: function(ENV, environmentName, applicationDefaultNamespace, callback) {

                var defaultEnvironment,
                    environment;

                flow()
                    .par(function (cb) {

                        require(["json!" + applicationDefaultNamespace + "/env/default"], function (d) {
                            defaultEnvironment = d;
                            cb();
                        }, function (err) {
                            cb(err);
                        });
                    }, function (cb) {
                        if (environmentName) {
                            require(["json!" + applicationDefaultNamespace + "/env/" + environmentName], function (d) {
                                environment = d;
                                cb();
                            }, function (err) {
                                cb(err);
                            });
                        } else {
                            cb();
                        }
                    })
                    .exec(function (err) {
                        ENV.set(_.extend({}, defaultEnvironment, environment));
                        callback && callback(err);
                    });



            }

        });
    }
);