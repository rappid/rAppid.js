var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.data.Collection", ["js.core.List"], function (List) {

        return List.inherit({

            defaults: {
                chunkSize: Infinity
            },

            // fetches the complete list
            fetch: function(options, callback) {
                options = options || {};
            }
        });
    });
});