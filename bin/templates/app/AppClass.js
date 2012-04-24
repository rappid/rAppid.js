define(
    ["js/core/Application"],
    function (Application) {

        return Application.inherit({
            /**
             *  initializes the application variables
             */
            initialize:function () {
                this.set('appName','<%= appName %>');
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