rAppid.defineClass("js.core.Application",
    ["js.core.UIComponent"], function (UIComponent) {
        return UIComponent.inherit({

            initialize: function () {
                // set up application wide vars
                this.callBase();
            },

            /**
             * Method called, when application is initialized
             *
             * @param {Object} parameter
             * @param {Function} callback
             */
            start: function (parameter, callback) {
                if (callback) {
                    callback(null);
                }
            },
            render: function (target) {
                var dom = this.callBase(null);

                if (target) {
                    target.appendChild(dom);
                }

                return dom;
            },
            toString: function () {
                return "js.core.Application";
            }
        });
    }
);