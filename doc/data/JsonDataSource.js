var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("doc.data.JsonDataSource",
        ["js.data.RestDataSource","js.data.DataSource"], function (RestDataSource, DataSource) {
            var JsonContext = DataSource.Context.inherit({
                createModel:function (factory, id, type) {
                   return this.callBase()
                }
            });


        return RestDataSource.inherit({

            getPathComponentsForModel: function(model){
                return [model.$.path];
            },
            createContext:function (properties, parentContext) {
                return new JsonContext();
            }
        });

    });
});