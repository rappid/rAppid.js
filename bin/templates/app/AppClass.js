var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("app.<%= appName %>Class",
        ["js.core.Application"],
        function (Application) {

            return Application.inherit({
                /**
                 *  initializes the application variables
                 */
                initialize: function(){
                    // TODO: set initial variables for markup (xaml)
                },
                /***
                 * Starts the application
                 * @param parameter
                 * @param callback
                 */
                start: function (parameter, callback) {
                    // false - disables autostart
                    this.callBase(parameter, false);

                    callback();
                }
            });
        }
    );
});