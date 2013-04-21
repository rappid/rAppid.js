define(["srv/handler/rest/ResourceHandler", "flow", "js/data/Collection"], function(ResourceHandler, flow, Collection) {

    var transactions = 0;

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
                    model.$context.createCollection(Collection.of(model.factory)).fetchPage(0, {limit: 1}, function (err, page) {
                        if (!err) {
                            model.set('key', model.$.project.identifier()+"-"+(page.getCollection().$itemsCount + (++transactions)));
                        }
                        cb(err);
                    });
                })
                .seq(function (cb) {
                    self._beforeModelCreate.baseImplementation.call(self, model, context, cb);
                })
                .exec(callback);
        },
        _afterModelCreate: function(model, context, callback){
            transactions--;

            callback && callback();
        }

    });
});