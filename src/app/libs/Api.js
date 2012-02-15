rAppid.defineClass("app.libs.Api", ["underscore"], function(_){
    var Api = function(configuration){
        configuration = configuration || {};

        _.defaults(configuration, {
            endPoint: "api"
        });

        this.$creationTime = new Date();
    };

    Api.prototype.creationTime = function() {
        return this.$creationTime.toTimeString();
    };

    return Api;

});