define(["srv/handler/rest/ResourceHandler", "flow", "js/data/Collection"], function(ResourceHandler, flow, Collection) {

    return ResourceHandler.inherit('server.rest.handler.TicketResourceHandler', {

        _beforeModelCreate: function(model, context, callback){
            var self = this;

            flow()
                .seq(function () {
                    if (model.identifier()) {
                        throw new Error("Can't set key manually");
                    }
                    if(!model.$.project){
                        throw new Error("Project is required");
                    }
                })
                .seq(function (cb) {
                    model.$context.createCollection(Collection.of(model.factory)).query(new Query().sort("-number")).fetchPage(0, {limit: 1}, function (err, page) {
                        if (!err) {
                            model.set('key', model.$.project.identifier()+"-"+(page.getCollection().$itemsCount + 1));
                        }
                        cb(err);
                    });
                })
                .seq(function (cb) {
                    self._beforeModelCreate.baseImplementation.call(self, model, context, cb);
                })
                .exec(callback);
        }

    });
});