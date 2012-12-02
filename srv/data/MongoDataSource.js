define(['js/data/DataSource', 'mongodb', 'js/data/Model', 'flow', 'underscore', 'js/core/List'], function (DataSource, MongoDb, Model, flow, _, List) {

    var ID_KEY = "_id",
        PARENT_ID_KEY = "_parent_id",
        PARENT_TYPE_KEY = "_parent_type",
        TYPE_KEY = "_type",
        REF_ID_KEY = "_ref_id",
        undefined;

    var MongoDataProcessor = DataSource.Processor.inherit('src.data.MongoDataProcessor', {
        compose: function (model, action, options) {
            var data = this.callBase();

            if (model.$parent) {
                data[PARENT_ID_KEY] = model.$parent.$.id;
                data[PARENT_TYPE_KEY] = model.$parent.factory.prototype.constructor.name;
            }

            var idSchema = model.schema['id'];
            if (!(idSchema && idSchema.type === String)) {
                data[ID_KEY] = this.$dataSource._createIdObject(data[ID_KEY]);
            }

            return data;
        },

        _composeSubModel: function (model, action, options) {
            if(model && model.$.id){
                var ret = {};
                ret[TYPE_KEY] = model.constructor.name;
                ret[REF_ID_KEY] = this.$dataSource._createIdObject(model.$.id);
                return ret;
            }
            return null;
        },

        _getReferenceKey: function (key, schemaType) {
            // correct key of id object
            if (key === "id") {
                return ID_KEY;
            }

            return this.callBase();
        },

        _getValueForKey: function (data, key, schemaType) {
            if (schemaType && schemaType.classof && schemaType.classof(Model)) {
                var referenceKey = this._getReferenceKey(key, schemaType);
                var value = data[referenceKey];
                delete data[referenceKey];
                if(value){
                    var refId = value[REF_ID_KEY];
                    if (refId) {
                        if (_.isObject(refId) && refId instanceof MongoDb.ObjectID) {
                            return {
                                id: refId.toHexString()
                            }
                        } else {
                            return {
                                id: refId
                            }
                        }
                    }
                }
                return null;
            }

            return this.callBase();

        },

        parse: function (model, data, action, options) {

            function readId(fromField) {
                if (data[fromField] && !data.id) {
                    var _id = data[fromField];

                    if (_.isObject(_id) && _id instanceof MongoDb.ObjectID) {
                        data['id'] = _id.toHexString();
                    } else {
                        data['id'] = _id;
                    }
                    delete data[fromField];

                    return true;
                }

                return false;
            }

            readId(ID_KEY) || readId(REF_ID_KEY);

            delete data[PARENT_ID_KEY];
            delete data[PARENT_TYPE_KEY];
            delete data[TYPE_KEY];
            delete data[REF_ID_KEY];

            return this.callBase(model, data, action, options);
        },

        _getIdForValue: function (value) {
            var id = this.callBase();

            if (id === undefined && value[REF_ID_KEY] instanceof  MongoDb.ObjectID) {
                id = value[REF_ID_KEY].toHexString();
            }

            return id;
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

            var server = new MongoDb.Server(this.$.host, this.$.port, {});

            var db = new MongoDb.Db(this.$.database, server, {});
            db.open(callback);
            return db;
        },

        _getConfigurationForModel: function (model) {
            return this.$dataSourceConfiguration.getConfigurationForModelClass(model.factory);
        },

        _createIdObject: function (id) {
            return new MongoDb.ObjectID(id);
        },

        loadModel: function (model, options, callback) {
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            var processor = this.getProcessorForModel(model);

            var data = processor.compose(model, options);


            var where = {
                _id: data._id
            };

            // here we have a polymorph type
            if (configuration.$.modelClassName !== model.constructor.name) {
                where[TYPE_KEY] = model.constructor.name;
            }

            // TODO: add loading/linking of sub models

            this.connectCollection(configuration.$.collection, function (collection, cb) {
                collection.findOne(where, function (err, object) {
                    if (!err) {
                        if (object) {
                            model.set(processor.parse(model, object));
                        } else {
                            err = DataSource.ERROR.NOT_FOUND;
                        }
                    }
                    cb(err);
                });
            }, function (err) {
                callback(err, model);
            });


        },

        connectCollection: function (collectionName, hook, callback) {

            var connection,
                self = this;

            flow()
                .seq("client", function (cb) {
                    connection = self.connect(cb);
                })
                .seq("collection", function () {
                    return new MongoDb.Collection(this.vars["client"], collectionName);
                })
                .seq(function (cb) {
                    hook(this.vars['collection'], cb);
                })
                .exec(function (err) {
                    if (connection) {
                        connection.close();
                    }

                    callback(err);
                });
        },

        _saveModel: function (model, options, callback) {
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            var action = DataSource.ACTION.UPDATE,
                method = MongoDataSource.METHOD.SAVE;

            if (model._status() === Model.STATE.NEW) {
                action = DataSource.ACTION.CREATE;
                method = MongoDataSource.METHOD.INSERT;
            }

            var processor = this.getProcessorForModel(model),
                data = processor.compose(model, action, options);

            options = options || {};
            // if you want to set a custom ID
            if (options.id && action === DataSource.ACTION.CREATE) {
                data[ID_KEY] = options.id;
            }

            // here we have a polymorphic type
            if (configuration.$.modelClassName !== model.constructor.name) {
                data[TYPE_KEY] = model.constructor.name;
            }

            this.connectCollection(configuration.$.collection, function(collection, cb) {
                if (method === MongoDataSource.METHOD.INSERT) {
                    collection.insert(data, {safe: true}, function (err, objects) {
                        if (!err) {
                            model.set(processor.parse(model, objects[0]));
                        }
                        cb(err);
                    });
                } else if (method === MongoDataSource.METHOD.SAVE) {
                    collection.update({_id: data._id}, data, {safe: true}, function (err, count) {
                        if (!err && count === 0) {
                            // no update happened
                            err = DataSource.ERROR.NOT_FOUND;
                        }
                        cb(err, model);
                    });
                } else {
                    cb("Wrong method");
                }
            }, function(err) {
                callback(err, model);
            });
        },

        removeModel: function (model, options, callback) {
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            var processor = this.getProcessorForModel(model);

            var data = processor.compose(model, options),
                self = this,
                connection;

            this.connectCollection(configuration.$.collection, function(collection, cb) {
                collection.remove({_id: data._id}, {safe: true}, function (err, count) {
                    if (count === 0) {
                        err = DataSource.ERROR.NOT_FOUND;
                    }
                    cb(err, model);
                });
            }, function(err) {
                callback(err, model);
            });

        },

        loadCollectionPage: function (collectionPage, options, callback) {
            var rootCollection = collectionPage.getRootCollection(),
                modelClassName = rootCollection.$modelFactory.prototype.constructor.name,
                configuration = this.$dataSourceConfiguration.getConfigurationForModelClass(rootCollection.$modelFactory);

            if (!configuration) {
                callback("Couldn't find path config for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            var mongoCollection = configuration.$.collection;

            if (!mongoCollection) {
                callback("No mongo collection defined for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            // TODO: add query, fields and options
            var self = this, connection, where = options.where || {};

            // here we have a polymorphic type
            if (configuration.$.modelClassName !== modelClassName) {
                where[TYPE_KEY] = modelClassName;
            }

            if (rootCollection.$parent) {
                where[PARENT_ID_KEY] = rootCollection.$parent.$.id;
                where[PARENT_TYPE_KEY] = rootCollection.$parent.factory.prototype.constructor.name;
            }

            var sort;
            if (options["sort"]) {
                sort = options["sort"];
            }

            this.connectCollection(mongoCollection, function(collection, cb) {

                flow()
                    .seq("cursor", function (cb) {
                        var cursor = collection.find(where);
                        if (sort) {
                            cursor = cursor.sort(sort);
                        }
                        if (options.limit) {
                            cursor = cursor.limit(options.limit);
                        }

                        cursor.toArray(function (err, results) {
                            if (!err) {
                                var processor = self.getProcessorForCollection(rootCollection);
                                results = processor.parseCollection(rootCollection, results, DataSource.ACTION.LOAD, options);
                                collectionPage.add(results);
                            }

                            cb(err, cursor);
                        });
                    })
                    .seq(function (cb) {
                        this.vars["cursor"].count(function (err, count) {
                            collectionPage.$itemsCount = count;
                            cb(err);
                        });
                    })
                    .exec(cb);
            }, function(err) {
                callback(err, collectionPage, options);
            });
        }
    });

    MongoDataSource.METHOD = {
        SAVE: 'save',
        INSERT: 'insert'
    };

    return MongoDataSource;
});