define(["js/conf/Configuration"], function (Configuration) {

    return Configuration.inherit('js.conf.Resource', {
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

        getConfigurationForPath: function(path) {
            return this.getConfigurationByKeyValue("path", path, false);
        }
    });

});