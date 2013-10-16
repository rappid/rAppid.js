define(["js/core/Application"], function (Application) {

        return Application.inherit({

            defaults: {
                appName: '<%= appName %>'
            },

            /***
             * Starts the application
             * @param parameter
             * @param callback
             */
            start:function (parameter, callback) {
                // false - disables autostart
                this.callBase(parameter, false);

                callback();
            }
        });
    }
);