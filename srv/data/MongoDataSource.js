define(['js/data/DataSource'], function(DataSource) {
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