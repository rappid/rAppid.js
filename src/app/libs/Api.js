rAppid.defineClass("app.libs.Api", [], function(){
    var Api = function(configuration){
        configuration = configuration || {};

        rAppid._.defaults(configuration, {
            endPoint: "api"
        });

        this.$creationTime = new Date();
    };

    Api.prototype.creationTime = function() {
        return this.$creationTime.toTimeString();
    };

    return Api;

});