define(["js/conf/Configuration", "js/data/Model"], function (Configuration, Model) {

    return Configuration.inherit('js.conf.ResourceConfiguration', {

        defaults: {
            /***
             * a custom resource handler to handle this request
             * @type srv.handler.rest.ResourceHandler
             */
            resourceHandler: null,

            /***
             * the full qualified class name of the model used for operating on this resource
             *
             * @type String
             * @required
             */
            modelClassName: null,

            /***
             * the rest path used for access and save the model data. Keep in mind that
             * ResourceConfiguration can be nested to have a context save environment.
             *
             * @type String
             * @required
             */
            path: null,

            /***
             * @type String
             */
            collectionClassName: null,

            /***
             * the name of the optional processor mapped with the $processors property of the RestDataSource
             *
             * @type String
             */
            processor: null
        },

        _initializationComplete: function () {
            this._validateConfiguration();
            this.callBase();
        },

        _validateConfiguration: function(){
            if (!this.$.modelClassName) {
                throw "no modelClassName defined for '" + this.$.path + "'.";
            }

        },

        getConfigurationForModelClassName: function (modelClassName) {
            return this.getConfigurationByKeyValue("modelClassName",modelClassName);
        },

        /**
         * Returns configuration for a given modelClass / model factory
         * @param {Function} modelClass
         * @return {js.conf.ResourceConfiguration}
         */
        getConfigurationForModelClass: function(modelClass){
            var configuration;
            while (!configuration && modelClass && modelClass.classof && modelClass.classof(Model)) {
                configuration = this.getConfigurationForModelClassName(modelClass.prototype.constructor.name);
                modelClass = modelClass.prototype.base;
            }

            return configuration;
        },

        getConfigurationForPath: function(path) {
            return this.getConfigurationByKeyValue("path", path, false);
        }
    });

});