define(["js/conf/Configuration", "js/data/Model"], function (Configuration, Model) {

    return Configuration.inherit('js.conf.ResourceConfiguration', {

        defaults: {
            resourceHandler: null
        },

        _initializationComplete: function () {
            this._validateConfiguration();
            this.callBase();
        },

        _validateConfiguration: function(){
            if (!this.$.modelClassName) {
                throw "no modelClassName defined for '" + this.$.path + "'.";
            }

            if(!this.$.collectionClassName){
                this.$.collectionClassName = "js.data.Collection["+this.$.modelClassName+"]";
            }

        },

        getConfigurationForModelClassName: function (modelClassName) {
            return this.getConfigurationByKeyValue("modelClassName",modelClassName);
        },

        getConfigurationForCollectionClassName: function (collectionClassName) {
            return this.getConfigurationByKeyValue("collectionClassName", collectionClassName);
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