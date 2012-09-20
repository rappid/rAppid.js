define(['js/data/DataSource', 'mongoskin', 'js/data/Model', 'flow'], function (DataSource, mongo, Model, flow) {


    var MongoDataProcessor = DataSource.Processor.inherit('src.data.MongoDataProcessor', {
        _getReferenceKey: function (key, schema) {
            // correct key of id object
            if (key === "id") {
                return "_id";
            }
            this.callBase();
        },
        _getCompositionValue: function (value, key, action, options) {
            // add correct id object
            if (key === "id" && value) {
                return this.$datasource.getIdObject(value);
            }
            return this.callBase();
        },
        parse: function (data, action, options) {
            if (data['_id']) {
                data['id'] = data._id.toHexString();
                delete data['_id'];
            }

            return this.callBase(data, action, options);
        }
    });

    var MongoDataSource = DataSource.inherit('srv.data.MongoDataSource', {

        defaults: {
            username: null,
            password: null,

            host: 'localhost',
            port: '27017',
            poolSize: 2,
            database: null,
            autoReconnect: true
        },

        $defaultProcessorFactory: MongoDataProcessor,

        db: function () {

            var connectionUrl = this.$.host + ":" + this.$.port + "/" + this.$.database;
            var params = [];
            if (this.$.autoReconnect) {
                params.push("auto_reconnect");
            }
            if (this.$.poolSize) {
                params.push("poolSize=" + this.$.poolSize);
            }

            if (params.length) {
                connectionUrl += "?" + params.join("&");
            }
            return mongo.db(connectionUrl);

        },
        _getConfigurationForModel: function (model) {
            return this.$dataSourceConfiguration.getConfigurationForModelClassName(model.constructor.name);
        },
        getIdObject: function (id) {
            return this.$db.ObjectID.createFromHexString(id);
        },
        loadModel: function (model, options, callback) {
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            try {
                var idObject = this.getIdObject(model.$.id);
            } catch(e) {
                callback("Coulnd't find entry " + configuration.$.collection + "/" + model.$.id);
            }

            // TODO: add loading/linking of sub models
            this.$db.collection(configuration.$.collection).findOne({_id: idObject}, function (err, result) {
                if (!err) {
                    if (result) {
                        model.set(model.parse(result[0]));
                        callback(null, model);
                    } else {
                        callback("Coulnd't find entry " + configuration.$.collection + "/" + model.$.id);
                    }
                } else {
                    callback(err);
                }
            });
        },

        saveModel: function (model, options, callback) {
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            var action = DataSource.ACTION.UPDATE, method = MongoDataSource.METHOD.SAVE;

            if (model._status() === Model.STATE.NEW) {
                action = DataSource.ACTION.CREATE;
                method = MongoDataSource.METHOD.INSERT;
            }

            var data = model.compose(this, action, options);

            var collection = this.$db.collection(configuration.$.collection);
            collection[method].call(collection, data, {}, function (err, result) {
                if (!err) {
                    if (result) {
                        // TODO: parse the payload and fill model
                        if (method == "insert") {
                            model.set(model.parse(result[0]));
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
        loadCollectionPage: function (collection, options, callback) {
            var rootCollection = collection.getRootCollection();
            var config = this.$dataSourceConfiguration.getConfigurationForModelClassName(rootCollection.$modelFactory.prototype.constructor.name);

            if (!config) {
                callback("Couldnt find path config for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            var mongoCollection = config.$.collection;
            if (!mongoCollection) {
                callback("No mongo collection defined for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            // TODO: add query, fields and options

            var self = this;
            var db = self.db();
            flow()
                .seq(function () {
                    db.collection(mongoCollection).find(function (err, cursor) {
                        if (!err) {
                            collection.$itemsCount = cursor.count();
                            cursor.toArray(function (err, results) {
                                if (!err) {
                                    collection.add(rootCollection.parse(results));
                                }
                                cb(null);
                            });
                        } else {
                            cb(err);
                        }
                    });

                    var tmp= db.collection(mongoCollection);
                    tmp.count(function(err, count) {
                        console.log(count);
                    });

                })
                .exec(function (err) {
                    db.close();
                    callback(err, collection, options);
                });
        }
    });

    MongoDataSource.METHOD = {
        SAVE: 'save',
        INSERT: 'insert'
    };

    return MongoDataSource;
});