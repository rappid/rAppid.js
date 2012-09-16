define(['require', 'srv/core/Handler', 'js/conf/DataSource', 'srv/handler/rest/ResourceRouter', 'flow'],
    function(require, Handler, DataSourceConfiguration, ResourceRouter, flow) {

    return Handler.inherit('srv.core.RestHandler', {

        ctor: function() {
            this.$dataSourceConfiguration = null;
            this.callBase();
        },

        addChild: function(child) {
            if (child instanceof DataSourceConfiguration) {
                this.$dataSourceConfiguration = child;
            }

            this.callBase();
        },

        _getResourceRouter: function() {
            return new ResourceRouter(this);
        },

        handleRequest: function(context, callback) {

            var self = this;

            if (!this.$dataSourceConfiguration) {
                throw new Error("DataSourceConfiguration missing.");
            }


            flow()
                .seq("resource", function(cb) {
                    self._getResourceRouter().getResource(context, cb);
                })
                .seq(function(cb) {
                    this.vars["resource"].handleRequest(context, cb);
                })
                .exec(callback);

        }
    });
});