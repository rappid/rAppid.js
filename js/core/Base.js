define(["inherit"], function(inherit){
    return inherit.Base.inherit({
        ctor: function () {
        },
        runsInBrowser: function () {
            return typeof window !== "undefined";
        }
    });
});