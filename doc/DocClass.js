var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("doc.DocClass",
        ["js.core.Application", "js.core.List", "doc.model.Class"],
        function (Application, List, ClassModel) {

            return Application.inherit({
                /**
                 * Initializes the app
                 * In this method we set the initial models
                 */
                initialize:function () {
                     this.set({
                         classes: new List(),
                         currentClass: null
                     });

                },
                /**
                 * Start the application and render it to the body ...
                 */
                start:function (parameter, callback) {
                    // false - disables autostart
                    this.callBase(parameter, false);
                    var self = this;

                    rAppid.require(["json!"+this.$.api.$.endPoint+"/index.json"],function(json){

                        for (var i = 0; i < json.length; i++) {
                            var cls = json[i];

                            var c = self.$.api.root().createModel(ClassModel, cls.className);
                            c.set(cls);
                            self.$.classes.add(c)
                        }

                        self.$.classes.sort();

                        self.$.classes.$items[0].fetch(null, function(item) {
                            console.log(item);
                        });

                        callback();
                    });

                },

                getUrl: function(item) {
                    return "#/view/" + item.$.className;
                },

                showDocumentation: function(id) {
                    var self = this;

                    this.$.api.createModel(ClassModel, id).fetch(null, function(err, cls){

                        console.log(cls);
                        if (!err) {
                            self.set("currentClass", cls);
                        } else {
                            console.log(err);
                        }
                    });
                }
            });
        }
    );
});