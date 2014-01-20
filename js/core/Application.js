define(["js/core/Window", "js/html/HtmlElement", "js/lib/extension", "underscore", "require", "flow"], function (Window, HtmlElement, Extension, _, require, flow) { //NOSONAR

    /***
     * @summary An application is a Window, which gets bootstrapped and started by rAppid.js and is attached to the WindowManager.
     *
     * @description Setting up and application can be easily done via the `rappidjs create app` command. For more information about projects \
     * have a look at http://rappidjs.com/#/wiki/Project
     *
     * @see js.core.WindowManager
     */
    return Window.inherit("js.core.Application", {
        $classAttributes: [/.+/],

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
         * @param {Object} [parameter] - parameter configuring the application
         * @param {Function} callback
         */
        start: function (parameter, callback) {
            this.show();

            this._startHistory(callback, parameter.initialHash);
        },

        /***
         *
         * @return {String} the name of the current environment
         * @private
         */
        _getEnvironment: function () {
            return this.$stage.$environmentName;
        },

        /***
         * the default namespace of the application.
         *
         * Within the application default namespace are several default directories located.
         *
         * **E.g.:**
         *
         *   +  **env** - contains for each environment an json file
         *   +  **locale** - contains for each locale a json file for translations
         *
         * the `env` directory for environments and the locale directory
         *
         * @type String
         */
        applicationDefaultNamespace: "app",

        /***
         * the `supportEnvironments` property determinate if the application has build in support for environments.
         *
         * The environment is determinated with the `_getEnvironment` method of the application and
         * returns by default the value of `environment` passed as start parameter of the application
         *
         * @wiki Environments
         */
        supportEnvironments: false,

        /***
         * Starts the history, which is responsible for navigation
         *
         * @param {Function} [callback] callback function, which is invoked after the history has started
         * @param {String} [initialHash=null] starts the history with this fragment
         * @private
         */
        _startHistory: function (callback, initialHash) {
            this.$stage.$history.start(callback, initialHash);
        },

        /***
         *
         * renders the application in the `target` Element.
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

        /***
         *
         * @param {js.core.Bindable} ENV - the bindable to set the environment values
         * @param {String} environmentName - the name of the environment to load
         * @param {String} applicationDefaultNamespace - the root namespace directory where to search for the env directory
         * @param {Function} callback
         */
        setupEnvironment: function (ENV, environmentName, applicationDefaultNamespace, callback) {

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
});