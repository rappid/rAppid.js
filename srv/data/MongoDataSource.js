define(['js/data/DataSource', 'mongodb', 'js/data/Model', 'flow', 'underscore', 'js/data/Collection', 'srv/lib/MongoQueryComposer'], function (DataSource, MongoDb, Model, flow, _, Collection, MongoQueryComposer) {

    var ID_KEY = "_id",
        CONTEXT_KEY = "_context",
        CONTEXT_URI_KEY = "_contextURI",
        PARENT_TYPE_KEY = "_parent_type",
        TYPE_KEY = "_type",
        REF_ID_KEY = "_ref_id",
        undefined;

    MongoQueryComposer = MongoQueryComposer.MongoQueryComposer;

    var translateOperator = MongoQueryComposer.translateOperator;

    MongoQueryComposer.translateOperator = function (operator) {
        /**
         * Fix to handle ID's right
         * @param operator
         * @returns {Function}
         */
        if (operator.field === "id") {
            if ((operator.value instanceof Array)) {
                for (var i = 0; i < operator.value.length; i++) {
                    operator.value[i] = new MongoDb.ObjectID(operator.value[i]);
                }
            } else {
                operator.value = new MongoDb.ObjectID(operator.value);
            }
            operator.field = "_id";
        }

        return translateOperator.call(this, operator);
    };

    /***
     * @inherit js.data.DataSource.Processor
     */
    var MongoDataProcessor = DataSource.Processor.inherit('srv.data.MongoDataProcessor', {
        compose: function (entity, action, options) {
            var data = this.callBase();

            if (entity instanceof Model) {
                data[CONTEXT_KEY] = this.$dataSource._composeContext(entity);

                if (entity.idField === "id") {
                    data[ID_KEY] = this.$dataSource._createIdObject(data[ID_KEY]);
                }
                // don't compose href field ...
                if(entity.hrefField){
                    delete data[entity.hrefField];
                }
            }

            return data;
        },

        _getCompositionValue: function (value, key, action, options) {
            if (value instanceof Model) {
                var context = this.$dataSource._composeContext(value);
                var ret = {};
                ret[value.idField] = value.identifier();
                ret[CONTEXT_KEY] = context;

                return ret;
            }

            return this.callBase();
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
            if (key === "id") {
                if (data[ID_KEY] instanceof MongoDb.ObjectID) {
                    return key.toHexString();
                }
            }

            return this.callBase();

        },

        parse: function (model, data, action, options) {

            if (model.createdField) {
                if(!data[model.createdField] && data[ID_KEY]) {
                    data[model.createdField] = data[ID_KEY].getTimestamp();
                }
            }

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

            readId(ID_KEY);

            delete data[CONTEXT_KEY];
            delete data[TYPE_KEY];

            return this.callBase(model, data, action, options);
        },

        _getIdForValue: function (value, factory) {
            var id;
            if (factory.classof && factory.classof(Model)) {
                id = value[factory.prototype.idField];
                if(id !== undefined){
                    return id;
                }
            }

            id = this.callBase();

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
            collectionPageSize: 500,

            host: 'localhost',
            port: 27017,
            poolSize: 2,
            database: null,
            autoReconnect: true,
            w: 1
        },

        $defaultProcessorFactory: MongoDataProcessor,

        connect: function (callback) {

            var server = new MongoDb.Server(this.$.host, this.$.port, {});

            var db = new MongoDb.Db(this.$.database, server, {w: this.$.w});
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

            var where = this._getWhereConditionForModel(model);

            // here we have a polymorph type
            if (configuration.$.modelClassName !== model.constructor.name) {
                where[TYPE_KEY] = model.constructor.name;
            }

            this.connectCollection(configuration.$.path, function (collection, cb) {
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


            if (model.updatedField && !model.get(model.updatedField)) {
                model.set(model.updatedField, new Date());
            }

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

            _.defaults(options || {}, {"safe": true, "new": true, "upsert": !!configuration.$.upsert});

            // here we have a polymorphic type
            if (configuration.$.modelClassName !== model.constructor.name) {
                data[TYPE_KEY] = model.constructor.name;
            }

            var where = this._getWhereConditionForModel(model);

            this.connectCollection(configuration.$.path, function (collection, cb) {
                if (method === MongoDataSource.METHOD.INSERT) {
                    collection.insert(data, options, function (err, objects) {
                        if (!err) {
                            model.set(processor.parse(model, objects[0]));
                        }
                        cb(err);
                    });
                } else if (method === MongoDataSource.METHOD.SAVE) {
                    collection.findAndModify(where, {}, data, options, function (err, newData, info) {
                        if (!err) {
                            if (!options.upsert && !newData) {
                                // no update happened
                                err = DataSource.ERROR.NOT_FOUND;
                            } else {
                                var idObject = newData._id;

                                if (idObject && model.createdField) {
                                    model.set(model.createdField, idObject.getTimestamp());
                                }
                            }
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

            var where = this._getWhereConditionForModel(model);

            this.connectCollection(configuration.$.path, function (collection, cb) {
                collection.remove(where, {safe: true}, function (err, count) {
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

            var mongoCollection = configuration.$.path;

            var params = {};
            collectionPage.$collection.$.query = collectionPage.$collection.$.query || new Query();
            if (collectionPage.$collection.$.query) {
                // TODO: add schema
                params = MongoQueryComposer.compose(collectionPage.$collection.$.query);
            }

            if (!mongoCollection) {
                callback("No mongo collection defined for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            // TODO: add query, fields and options
            var self = this,
                addWhere = this._getWhereConditionForCollection(rootCollection) || {},
                where = params.where || {};

            // here we have a polymorphic type
            if (configuration.$.modelClassName !== modelClassName) {
                addWhere[TYPE_KEY] = modelClassName;
            }

            // extend where
            if (where.$and) {
                where.$and.push(addWhere);
            } else {
                _.extend(addWhere, where);
            }

            var offset = collectionPage.$offset;
            var limit = collectionPage.$limit;
            // TODO: convert query to MongoQuery


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

                        cursor = cursor.limit(limit);
                        cursor = cursor.skip(offset);


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
                            collectionPage.$collection.$.$itemsCount = count;
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

            var mongoCollection = configuration.$.path;

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
                where[CONTEXT_KEY] = this._composeContext(rootCollection);
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
                return this.getContextByProperties(requestor, null, requestor.$context);
            }
            return this.callBase();
        },

        _getWhereConditionForModel: function (model) {
            var where = {};

            where[CONTEXT_KEY] = this._composeContext(model);

            if (model.idField === "id") {
                where[ID_KEY] = this._createIdObject(model.identifier());
            } else {
                where[model.idField] = model.identifier();
            }
            return where;
        },

        _getWhereConditionForCollection: function (collection) {
            var where = {};

            where[CONTEXT_KEY] = this._composeContext(collection);

            return where;
        },

        _composeContext: function (model) {
            var parent = model.$context.$contextModel,
                context = {},
                contextStack = [],
                uri = [];

            // go to root context
            while (parent) {
                contextStack.unshift(parent);
                parent = parent.$parent;
            }

            var configuration = this.$dataSourceConfiguration,
                path,
                id;

            for (var i = 0; i < contextStack.length; i++) {
                configuration = configuration.getConfigurationForModelClass(contextStack[i].factory);
                path = configuration.$.path;
                id = contextStack[i].identifier();
                context[path] = id;
            }

            return context;
        },
        _getContext: function (factory, model, value) {

            if (model instanceof Model && factory.classof(Model) && !_.isString(value) && value instanceof Object) {
                var configuration = this.$dataSourceConfiguration;
                var valueContext = value[CONTEXT_KEY],
                    stack = [];
                if (valueContext) {
                    for (var key in valueContext) {
                        if (valueContext.hasOwnProperty(key)) {
                            configuration = configuration.getConfigurationForPath(key);
                            stack.push(configuration);
                        }
                    }
                }

                var parentFactory,
                    parentModel,
                    context,
                    fullModelClassName;
                for (var i = 0; i < stack.length; i++) {
                    fullModelClassName = stack[i].$.modelClassName.replace(/\./gi, "/");
                    parentFactory = requirejs(fullModelClassName);
                    context = this.getContextForChild(parentFactory, parentModel);
                    parentModel = context.createEntity(parentFactory, valueContext[stack[i].$.path]);
                    parentModel.$parent = context.$contextModel;
                }

                context = this.getContextForChild(factory, parentModel);

                parentModel = context.createEntity(factory, value[model.idField]);

                return parentModel.$context;
            }

            return this.callBase();
        },

        createContext: function (contextModel, properties, parentContext) {
            return new MongoDataSource.Context(this, contextModel, properties, parentContext);
        }
    });

    MongoDataSource.Context = DataSource.Context.inherit("srv.data.MongoDataSource.Context", {

        createCollection: function (factory, options, type) {
            options = options || {};
            _.defaults(options, {
                pageSize: this.$dataSource.$.collectionPageSize || 100
            });

            return this.callBase(factory, options, type);
        }
    });

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