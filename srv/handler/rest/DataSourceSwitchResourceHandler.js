define(['srv/handler/rest/ResourceHandler'], function(ResourceHandler) {
    return ResourceHandler.inherit('srv.handler.rest.DataSourceSwitchResourceHandler', {

        defaults: {
            prefix: null,
            suffix: null,
            dataSourceName: null
        },

        getDataSource: function(context) {

            for (var i = 0; i < this.$restHandler.$dataSources.length; i++) {
                var dataSource = this.$restHandler.$dataSources[i];
                if (dataSource.$.name === this.$.dataSourceName) {
                    return dataSource;
                }
            }

            return this.$restHandler.getDataSource(context);
        }

    });
});