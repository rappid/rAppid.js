define(['js/data/DataSource', 'mongodb', 'js/data/Model', 'flow', 'underscore', 'js/core/List', 'require', 'js/data/Collection', 'srv/lib/MongoQueryComposer'], function (DataSource, MongoDb, Model, flow, _, List, require, Collection, MongoQueryComposer) {

    var ID_KEY = "_id",
        PARENT_ID_KEY = "_parent_id",
        PARENT_TYPE_KEY = "_parent_type",
        TYPE_KEY = "_type",
        REF_ID_KEY = "_ref_id",
        undefined;

    MongoQueryComposer = MongoQueryComposer.MongoQueryComposer;

    var MongoDataProcessor = DataSource.Processor.inherit('src.data.MongoDataProcessor', {
        compose: function (entity, action, options) {
            var data = this.callBase();

            if (entity instanceof Model) {
                if (entity.$parent) {
                    data[PARENT_ID_KEY] = entity.$parent.identifier();
                    data[PARENT_TYPE_KEY] = entity.$parent.factory.prototype.constructor.name;
                }

                data[ID_KEY] = this.$dataSource._createIdObject(data[ID_KEY]);
            }

            return data;
        },

        _composeSubModel: function (model, action, options) {
            if (model && model.$.id) {
                var ret = {};
                ret[TYPE_KEY] = model.constructor.name;
                ret[REF_ID_KEY] = model.identifier();
                return ret;
            }
            return null;
        },

        _composeEntity: function (entity, action, options) {
            // give entities an ID, so the caching works correctly
            if (!entity.$.id && !(entity instanceof Model)) {
                entity.$.id = generateId();
            }
            return this.callBase(entity, action, options);
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
                if (value) {
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
            } else if (key === "id") {
                if (data[ID_KEY] instanceof MongoDb.ObjectID) {
                    return key.toHexString();
                }

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

            if (data[PARENT_ID_KEY]) {
                var parentId = data[PARENT_ID_KEY],
                    parentFactory = require(data[PARENT_TYPE_KEY].replace(/\./g, "/"));
                model.$parent = this.$dataSource.createEntity(parentFactory, parentId);
            }
            delete data[PARENT_ID_KEY];
            delete data[PARENT_TYPE_KEY];
            delete data[TYPE_KEY];
            delete data[REF_ID_KEY];

            return this.callBase(model, data, action, options);
        },

        _getIdForValue: function (value) {
            var id = this.callBase();

            if (id === undefined && value[ID_KEY] instanceof MongoDb.ObjectID) {
                id = value[ID_KEY].toHexString();
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
            var where = {};

            if (model.idField === "id") {
                where["_id"] = data._id;
            } else {
                where[model.idField] = model.identifier();
            }


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

            var action,
                method;
            if (!options.action) {
                action = DataSource.ACTION.UPDATE;

                if (model._status() === Model.STATE.NEW) {
                    action = DataSource.ACTION.CREATE;
                }
            } else {
                action = options.action;
            }

            if (action === DataSource.ACTION.UPDATE) {
                method = MongoDataSource.METHOD.SAVE;
            } else if (action === DataSource.ACTION.CREATE) {
                method = MongoDataSource.METHOD.INSERT;
            }

            var processor = this.getProcessorForModel(model),
                data = processor.compose(model, action, options);

            options = options || {};
            // if you want to set a custom ID
            if (options.id && action === DataSource.ACTION.CREATE) {
                var id = options.id;
                try {
                    id = this._createIdObject(options.id);
                } catch(e) {
                    // TODO: warn that ID object couldn't be created
                }
                data[ID_KEY] = id;
            }

            // here we have a polymorphic type
            if (configuration.$.modelClassName !== model.constructor.name) {
                data[TYPE_KEY] = model.constructor.name;
            }

            this.connectCollection(configuration.$.collection, function (collection, cb) {
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
            }, function (err) {
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

            this.connectCollection(configuration.$.collection, function (collection, cb) {
                collection.remove({_id: data._id}, {safe: true}, function (err, count) {
                    if (count === 0) {
                        err = DataSource.ERROR.NOT_FOUND;
                    }
                    cb(err, model);
                });
            }, function (err) {
                callback(err, model);
            });

        },

        loadCollectionPage: function (collectionPage, options, callback) {
            var rootCollection = collectionPage.getRoot(),
                modelClassName = rootCollection.$modelFactory.prototype.constructor.name,
                configuration = this.$dataSourceConfiguration.getConfigurationForModelClass(rootCollection.$modelFactory);

            if (!configuration) {
                callback("Couldn't find path config for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            var mongoCollection = configuration.$.collection;

            var params = {};
            if (collectionPage.$collection.$.query) {
                // TODO: add schema
                params = MongoQueryComposer.compose(collectionPage.$collection.$.query);
            }

            if (!mongoCollection) {
                callback("No mongo collection defined for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            // TODO: add query, fields and options
            var self = this, connection, where = params.where || {};

            // TODO: convert query to MongoQuery

            // here we have a polymorphic type
            if (configuration.$.modelClassName !== modelClassName) {
                where[TYPE_KEY] = modelClassName;
            }

            if (rootCollection.$parent) {
                where[PARENT_ID_KEY] = rootCollection.$parent.$.id;
                where[PARENT_TYPE_KEY] = rootCollection.$parent.factory.prototype.constructor.name;
            }

            var sort;
            if (params.sort) {
                sort = params.sort;
            }

            this.connectCollection(mongoCollection, function (collection, cb) {
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
                                var processor = self.getProcessorForCollection(rootCollection),
                                    items;
                                items = processor.parseCollection(rootCollection, results, DataSource.ACTION.LOAD, options);
                                collectionPage.add(items);
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
            }, function (err) {
                callback(err, collectionPage, options);
            });
        },

        countCollection: function (collection, options, callback) {
            var rootCollection = collection.getRoot(),
                modelClassName = rootCollection.$modelFactory.prototype.constructor.name,
                configuration = this.$dataSourceConfiguration.getConfigurationForModelClass(rootCollection.$modelFactory);

            if (!configuration) {
                callback("Couldn't find path config for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            var mongoCollection = configuration.$.collection;

            var params = {};
            if (collection.$.query) {
                // TODO: add schema
                params = MongoQueryComposer.compose(collection.$.query);
            }

            if (!mongoCollection) {
                callback("No mongo collection defined for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            // TODO: add query, fields and options
            var where = params.where || {};

            // here we have a polymorphic type
            if (configuration.$.modelClassName !== modelClassName) {
                where[TYPE_KEY] = modelClassName;
            }

            if (rootCollection.$parent) {
                where[PARENT_ID_KEY] = rootCollection.$parent.$.id;
                where[PARENT_TYPE_KEY] = rootCollection.$parent.factory.prototype.constructor.name;
            }

            var count;
            this.connectCollection(mongoCollection, function (collection, cb) {
                flow()
                    .seq("cursor", function (cb) {
                        cb(null, collection.find(where));
                    })
                    .seq("count", function (cb) {
                        this.vars["cursor"].count(cb);
                    })
                    .exec(function (err, results) {
                        if (!err) {
                            count = results["count"];
                        }
                        cb(err);
                    });
            }, function (err) {
                callback(err, count, options);
            });
        },

        getContextForChild: function (childFactory, requestor) {
            if (childFactory.classof(Collection)) {
                return this.getContextByProperties(requestor, requestor.$context);
            }
            return this.callBase();
        }
    });

    var operatorMap = {
        ge: "gte",
        le: "lte"
    };

    var knownOperators = [];

    var generateId = function () {
        var d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    };

    MongoDataSource.METHOD = {
        SAVE: 'save',
        INSERT: 'insert'
    };

    return MongoDataSource;
});