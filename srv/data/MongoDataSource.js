define(['js/data/DataSource', 'mongodb', 'js/data/Model', 'flow', 'underscore'], function (DataSource, mongoDb, Model, flow, _) {

    var ID_KEY = "_id",
        PARENT_KEY = "_parent_id",
        TYPE_KEY = "_type";

    var MongoDataProcessor = DataSource.Processor.inherit('src.data.MongoDataProcessor', {
        compose: function(model, action, options){
            var data = this.callBase();

            if(model.$parent){
                data[PARENT_KEY] = model.$parent.$.id;
            }

            var idSchema = model.schema['id'];
            if(!(idSchema && idSchema.type === String)){
                data[ID_KEY] = this.$dataSource._createIdObject(data[ID_KEY]);
            }

            return data;
        },
        _composeSubModel: function (model, action, options) {
            return this.$dataSource._createIdObject(model.$.id);
        },
        _getReferenceKey: function (key, schemaType) {
            // correct key of id object
            if (key === "id") {
                return ID_KEY;
            }
            if(schemaType && schemaType.classof && schemaType.classof(Model)){
                return key + "_id";
            }

            return this.callBase();
        },
        _getValueForKey: function(data, key, schemaType){
            if(schemaType && schemaType.classof && schemaType.classof(Model)){
                var referenceKey = this._getReferenceKey(key, schemaType);
                var id = data[referenceKey];
                delete data[referenceKey];
                if(id){
                    if(_.isObject(id) && id instanceof mongoDb.ObjectID){
                        return {
                            id: id.toHexString()
                        }
                    }else{
                        return {
                            id: id
                        }
                    }
                }
                return null;
            }

            return this.callBase();

        },
        parse: function (model, data, action, options) {
            if (data['_id']) {
                var _id = data['_id'];

                if(_.isObject(_id) && _id instanceof mongoDb.ObjectID){
                    data['id'] = _id.toHexString();
                }else{
                    data['id'] = _id;
                }
                delete data['_id'];
            }
            delete data[PARENT_KEY];
            delete data[TYPE_KEY];

            return this.callBase(model, data, action, options);
        }
    });

    var MongoDataSource = DataSource.inherit('srv.data.MongoDataSource', {

        defaults: {
            username: null,
            password: null,

            host: 'localhost',
            port: 27017,
            poolSize: 2,
            database: null,
            autoReconnect: true
        },

        $defaultProcessorFactory: MongoDataProcessor,

        connect: function (callback) {

            var server = new mongoDb.Server(this.$.host, this.$.port, {});

            var db = new mongoDb.Db(this.$.database, server, {});
            db.open(callback);
            return db;
        },
        _getConfigurationForModel: function (model) {
            return this.$dataSourceConfiguration.getConfigurationForModelClass(model.factory);
        },
        _createIdObject: function (id) {
            return new mongoDb.ObjectID(id);
        },
        loadModel: function (model, options, callback) {
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            var processor = this.getProcessorForModel(model);

            var data = processor.compose(model,options);


            var where = {
                _id: data._id
            };

            // here we have a polymorph type
            if (configuration.$.modelClassName !== model.constructor.name) {
                where[TYPE_KEY] = model.constructor.name;
            }

            // TODO: add loading/linking of sub models
            var self = this, connection;
            flow()
                .seq("collection", function (cb) {
                    connection = self.connect(function (err, client) {
                        cb(err, new mongoDb.Collection(client, configuration.$.collection));
                    });
                })
                .seq(function (cb) {
                    this.vars['collection'].findOne(where, function (err, object) {
                        if (!err) {
                            if(object){
                                model.set(processor.parse(model, object));
                            }else{
                                err = DataSource.ERROR.NOT_FOUND;
                            }
                        }
                        cb(err);
                    });
                })
                .exec(function (err) {
                    if (connection) {
                        connection.close();
                    }
                    callback(err, model);

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
            var processor = this.getProcessorForModel(model);

            var data = processor.compose(model, action, options), self = this, connection;

            // if you want to set a custom ID
            if(options.id && action === DataSource.ACTION.CREATE){
                data[ID_KEY] = options.id;
            }

            // here we have a polymorphic type
            if (configuration.$.modelClassName !== model.constructor.name) {
                data[TYPE_KEY] = model.constructor.name;
            }

            flow()
                .seq("collection", function (cb) {
                    connection = self.connect(function (err, client) {
                        cb(err, new mongoDb.Collection(client, configuration.$.collection));
                    });
                })
                .seq(function (cb) {
                    if (method === MongoDataSource.METHOD.INSERT) {
                        this.vars['collection'].insert(data, {safe: true}, function (err, objects) {
                            if (!err) {
                                model.set(processor.parse(model, objects[0]));
                            }
                            cb(err);
                        });
                    } else if (method === MongoDataSource.METHOD.SAVE) {
                        this.vars['collection'].update({_id: data._id}, data, {safe: true}, function (err, count) {
                            if(!err && count === 0){
                                // no update happend
                                err = DataSource.ERROR.NOT_FOUND;
                            }
                            cb(err, model);
                        });
                    } else {
                        cb("Wrong method");
                    }
                })
                .exec(function (err) {
                    if (connection) {
                        connection.close();
                    }
                    callback(err, model);

                });
        },

        removeModel: function(model, options, callback){
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            var processor = this.getProcessorForModel(model);

            var data = processor.compose(model, options);

            flow()
                .seq("collection", function (cb) {
                    connection = self.connect(function (err, client) {
                        cb(err, new mongoDb.Collection(client, configuration.$.collection));
                    });
                })
                .seq(function (cb) {
                    this.vars['collection'].remove({_id: data._id}, {safe: true}, function (err, count) {
                        if(count === 0){
                            err = DataSource.ERROR.NOT_FOUND;
                        }
                        cb(err, model);
                    });
                })
                .exec(function (err) {
                    if (connection) {
                        connection.close();
                    }
                    callback(err, model);

                });
        },

        loadCollectionPage: function (collection, options, callback) {
            var rootCollection = collection.getRootCollection(),
                modelClassName = rootCollection.$modelFactory.prototype.constructor.name,
                configuration = this.$dataSourceConfiguration.getConfigurationForModelClass(rootCollection.$modelFactory);

            if (!configuration) {
                callback("Couldnt find path config for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            var mongoCollection = configuration.$.collection;
            if (!mongoCollection) {
                callback("No mongo collection defined for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            // TODO: add query, fields and options

            var self = this, connection, where = {};

            // here we have a polymorph type
            if (configuration.$.modelClassName !== modelClassName) {
                where[TYPE_KEY] = modelClassName;
            }

            if(rootCollection.$parent){
                where[PARENT_KEY] = rootCollection.$parent.$.id;
            }

            flow()
                .seq("collection", function (cb) {
                    connection = self.connect(function (err, client) {
                        cb(err, new mongoDb.Collection(client, mongoCollection));
                    });
                })
                .seq("cursor", function (cb) {
                    var cursor = this.vars["collection"].find(where);
                    if(options.limit){
                        cursor = cursor.limit(options.limit);
                    }

                    cursor.toArray(function (err, results) {
                        if (!err) {
                            var processor = self.getProcessorForCollection(rootCollection);

                            results = processor.parseCollection(rootCollection, results, DataSource.ACTION.LOAD, options);

                            collection.add(results);
                        }
                        cb(err, cursor);
                    });
                })
                .seq(function (cb) {
                    this.vars["cursor"].count(function (err, count) {
                        collection.$itemsCount = count;
                        cb(err);
                    });
                })
                .exec(function (err) {
                    if (connection) {
                        connection.close();
                    }
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