var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    /***
     *
     * Acts as base class for
     *
     * @class js.data.ListView
     */
    rAppid.defineClass("js.data.ListView", ["js.core.List"], function (List) {

        return List.inherit({

        })
    });
});