define(['js/data/DataSource', 'mongoskin'], function(DataSource, MongoSkin) {
    return DataSource.inherit('srv.data.MongoDataSource', {

        defaults: {
            username: null,
            password: null,

            host: null,
            port: null,

            database: null,
            autoReconnect: false
        }

    });
});