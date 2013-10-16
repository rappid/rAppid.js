define(["js/data/Model", "js/data/RestDataSource"], function (Model, RestDataSource) {
    return Model.inherit("rest.model.User", {
        schema: {
            email: String,
            authentication: {
                type: Object,
                generated: true
            }
        },
        compose: function (action, options) {
            var ret = this.callBase();
            if (action === "GET") {
                ret.authentication = undefined;
            }

            return ret;
        }
    });
});