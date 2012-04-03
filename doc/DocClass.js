var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("doc.DocClass",
        ["js.core.Application", "doc.data.JsonDataSource", "doc.model.Module", "js.data.Model"],
        function (Application, DataSource, Module, Model) {

            return Application.inherit({
                /**
                 * Initializes the app
                 * In this method we set the initial models
                 */
                initialize:function () {
                     this.set("classList",[]);
                },
                /**
                 * Start the application and render it to the body ...
                 */
                start:function (parameter, callback) {
                    // false - disables autostart
                    this.callBase(parameter, false);
                    var self = this;
                    rAppid.require(["json!"+this.$.api.$.gateway+"/index.json"],function(json){
                        self.set("classList",json);
                        callback();
                    });

                }
            });
        }
    );
});