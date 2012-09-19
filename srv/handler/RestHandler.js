define(['require', 'srv/core/Handler', 'js/conf/DataSource', 'js/conf/Resource', 'srv/handler/rest/ResourceRouter', 'flow', 'js/data/DataSource'],
    function(require, Handler, DataSourceConfiguration, ResourceConfiguration, ResourceRouter, flow, DataSource) {

    return Handler.inherit('srv.core.RestHandler', {

        ctor: function() {
            this.$resourceConfiguration = null;
            this.$dataSource = null;

            this.callBase();
        },

        addChild: function(child) {
            if (child instanceof DataSourceConfiguration) {
                this.$resourceConfiguration = child;
            }

            if (child instanceof DataSource) {
                this.$dataSource = child;
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

            if (!this.$dataSource) {
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
                        if(config.$.serverModelClassName){
                            classes.push(config.$.serverModelClassName.replace(/\./g, '/'));
                        }
                        if(config.$.resourceClassName){
                            classes.push(config.$.resourceClassName.replace(/\./g, '/'));
                        }
                        findClasses(config);
                    }
                }
            }

            findClasses(this.$resourceConfiguration);


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
            return this.$dataSource;
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