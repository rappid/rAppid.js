define(['require', 'srv/core/Handler', 'js/conf/DataSource', 'srv/handler/rest/ResourceRouter'],
    function(require, Handler, DataSourceConfiguration, ResourceRouter) {

    return Handler.inherit('srv.core.RestHandler', {

        ctor: function() {
            this.$dataSourceConfiguration = null;
            this.callBase();
        },

        start: function(callback) {
            var resourceClasses = [];

            // TODO: determinate resource

            require(resourceClasses, function() {
                callback();
            }, function(err) {
                callback(err);
            });

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

        handleRequest: function(context) {

            if (!this.$dataSourceConfiguration) {
                throw new Error("DataSourceConfiguration missing.");
            }

            var resource = this._getResourceRouter().getResource(context);
            resource.handleRequest(context);

        }
    });
});