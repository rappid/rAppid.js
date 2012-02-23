var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.core.Model", ["js.core.Bindable"], function (Bindable) {
        return Bindable.inherit({
            ctor: function (attributes) {
                this.callBase(attributes);
            },
            create: function (options, callback) {

            },
            save: function (options, callback) {

            },
            fetch: function (options, callback) {

            },
            "delete": function (options, callback) {

            }
        })
    });
});