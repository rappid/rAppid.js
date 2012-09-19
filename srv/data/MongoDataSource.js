define(['js/data/DataSource', 'mongoskin', 'js/data/Model'], function(DataSource, mongo, Model) {
    return DataSource.inherit('srv.data.MongoDataSource', {

        defaults: {
            username: null,
            password: null,

            host: 'localhost',
            port: '27017',

            database: null,
            autoReconnect: false
        },
        initialize: function(){
            var connectionPath = this.$.host + ":" + this.$.port + "/" + this.$.database;
            if(this.$.autoReconnect){
                connectionPath += "?auto_reconnect";
            }

            this.$db = mongo.db(connectionPath);

            this.callBase();
        },
        _getConfigurationForModel: function(model){
            return this.$dataSourceConfiguration.getConfigurationForModelClassName(model.constructor.name);
        },

        loadModel: function(model, options, callback){
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            this.$db.collection(configuration.$.collection).findOne({id: model.$.id}, function(err, payload){
                if(!err){
                    if(payload){
                        // TODO: parse the payload and fill model
                    }else{
                        callback("Coulnd't found entry " + configuration.$.collection + "/" + model.$.id);
                    }
                }else{
                    callback(err);
                }
            });
        },

        saveModel: function(model, options, callback){
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            var action = DataSource.ACTION.UPDATE, method = "save";

            var data = model.compose(this, action, options);

            if (model._status() === Model.STATE.NEW) {
                action = DataSource.ACTION.CREATE;
                method = "insert";
            }

            var collection = this.$db.collection(configuration.$.collection);
            collection[method].call(collection, data, {}, function (err, result) {
                if (!err) {
                    if (result) {
                        // TODO: parse the payload and fill model
                        if(method == "insert"){
                            model.set('id',result[0]._id.id);
                        }
                        callback(null, model);
                    } else {
                        callback("Coulnd't save entry " + configuration.$.collection + "/" + model.$.id);
                    }
                } else {
                    callback(err);
                }
            });
        },
        loadCollectionPage: function(list, options, callback){
            if (callback) {
                callback("Implement loadCollectionPage in MongoDataSource", list);
            }
        }
    });
});