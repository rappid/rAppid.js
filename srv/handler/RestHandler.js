define(['require', 'srv/core/Handler', 'js/conf/DataSourceConfiguration', 'js/conf/ResourceConfiguration', 'srv/handler/rest/ResourceRouter', 'flow', 'js/data/DataSource', 'js/data/RestDataSource'],
    function(require, Handler, DataSourceConfiguration, ResourceConfiguration, ResourceRouter, flow, DataSource, RestDataSource) {

    return Handler.inherit('srv.core.RestHandler', {

        ctor: function() {
            this.$resourceConfiguration = null;
            this.$dataSources = [];

            this.callBase();
        },

        addChild: function(child) {
            if (child instanceof DataSourceConfiguration) {
                this.$resourceConfiguration = child;
            }

            if (child instanceof DataSource) {
                this.$dataSources.push(child);
            }

            this.callBase();
        },

        _getResourceRouter: function() {
            return new ResourceRouter(this);
        },

        start: function(server, callback){
            if (!this.$resourceConfiguration) {
                callback(new Error("ResourceConfiguration missing."));
                return;
            }

            if (this.$dataSources.length === 0) {
                callback(new Error("DataSource missing."));
                return;
            }

            var classes = [];

            function findClasses(resourceConfiguration){
                var config;
                for(var i = 0; i < resourceConfiguration.$configurations.length; i++){
                    config = resourceConfiguration.$configurations[i];
                    if(config instanceof ResourceConfiguration){
                        if(config.$.modelClassName){
                            classes.push(config.$.modelClassName.replace(/\./g,'/'));
                        }
                        // TODO: necessary ?
                        if(config.$.serverModelClassName){
                            classes.push(config.$.serverModelClassName.replace(/\./g, '/'));
                        }
                        findClasses(config);
                    }
                }
            }

            findClasses(this.$resourceConfiguration);

            // FIXME
            // TODO: remove $restDataSource and reuse getProcessorForModel and getProcessorForCollection an other way
            this.$restDataSource = new RestDataSource({endPoint: "localhost"}, false);
            this.$restDataSource.addChild(this.$resourceConfiguration);
            this.$restDataSource._initialize("auto");

            require(classes, function() {
                callback();
            }, function(err) {
                callback(err);
            });

        },

        /***
         *
         * @param {srv.core.Context} context
         * @return {*}
         */
        getDataSource: function(context) {
            return this.$dataSources[0];
        },

        handleRequest: function(context, callback) {

            var self = this;

            flow()
                .seq("resource", function (cb) {
                    self._getResourceRouter().getResource(context, cb);
                })
                .seq(function (cb) {
                    this.vars["resource"].handleRequest(context, cb);
                })
                .exec(callback);

        }
    });
});