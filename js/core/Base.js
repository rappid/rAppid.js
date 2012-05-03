define(["inherit"], function(inherit){

    return inherit.Base.inherit("js.core.Base",{
        /** @lends Base **/
        ctor: function () {
        },
        runsInBrowser: function () {
            return typeof window !== "undefined";
        }
    });
});