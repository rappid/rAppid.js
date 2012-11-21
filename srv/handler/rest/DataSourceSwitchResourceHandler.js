define(['srv/handler/rest/ResourceHandler'], function (ResourceHandler) {
    return ResourceHandler.inherit('srv.handler.rest.DataSourceSwitchResourceHandler', {

        defaults: {
            prefix: null,
            suffix: null
        },

        getDataSource: function (context, childResource) {

            if (childResource) {
                var dataSource = this.$restHandler.$dataSources[0];

                // create a clone
                dataSource = dataSource.clone();
                dataSource.set('database', this.$.prefix + this.$resourceId);

                return dataSource;
            }
            return this.$restHandler.getDataSource(context);
        }

    });
});