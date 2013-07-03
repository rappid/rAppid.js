define(["js/data/DataSource", "js/data/Model", "js/data/Collection", "flow"], function (DataSource, Model, Collection, flow) {

    var ID_KEY = "_id",
        CONTEXT_KEY = "_context",
        TYPE_KEY = "_type";

    var generateId = function () {
        var d = new Date().getTime();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    };

    /***
     * @inherit js.data.KeyValueDataSource.Processor
     */
    var KeyValueDataSourceProcessor = DataSource.Processor.inherit('src.data.KeyValueDataProcessor', {
        compose: function (entity, action, options) {
            var data = this.callBase();

            if (entity instanceof Model) {
                data[CONTEXT_KEY] = this.$dataSource._composeContext(entity);

                if (entity.idField === "id") {
                    data[ID_KEY] = this.$dataSource._createIdObject(data[ID_KEY]);
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

        parse: function (model, data, action, options) {

            this._preParse(model, data, action, options);

            if (model.createdField) {
                if (data[ID_KEY]) {
                    data[model.createdField] = data[ID_KEY].getTimestamp();
                }
            }

            delete data[CONTEXT_KEY];
            delete data[TYPE_KEY];


            return this.callBase(model, data, action, options);
        },

        _preParse: function (model, data, action, options) {

            // do nothing

        },

        _getIdForValue: function (value, factory) {

            if (factory.classof && factory.classof(Model)) {
                return value[factory.prototype.idField];
            }

            return this.callBase();
        }
    });

    var KeyValueDataSource = DataSource.inherit('js.data.KeyValueDataSource', {

        $defaultProcessorFactory: KeyValueDataSourceProcessor,

        connect: function (callback) {
            callback && callback();
        },


        getContextForChild: function (childFactory, requestor) {
            if (childFactory.classof(Collection)) {
                return this.getContextByProperties(requestor, null, requestor.$context);
            }
            return this.callBase();
        },
        /**
         * returns the configuration for a model
         * @param model
         * @returns {*}
         * @private
         */
        _getConfigurationForModel: function (model) {
            return this.$dataSourceConfiguration.getConfigurationForModelClass(model.factory);
        },

        _createIdObject: function (id) {
            return id;
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
            var parent = model.$parent,
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

        saveModel: function (model, options, callback) {
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            var action;

            if (!options.action) {
                action = DataSource.ACTION.UPDATE;

                if (model._status() === Model.STATE.NEW) {
                    action = DataSource.ACTION.CREATE;
                }
            } else {
                action = options.action;
            }


            var processor = this.getProcessorForModel(model),
                data = processor.compose(model, action, options);

            _.defaults(options || {}, {safe: true, upsert: !!configuration.$.upsert});

            // here we have a polymorphic type
            if (configuration.$.modelClassName !== model.constructor.name) {
                data[TYPE_KEY] = model.constructor.name;
            }

            var where = this._getWhereConditionForModel(model);

            options.createdField = model.createdField;

            if (model.updatedField) {
                model.set(model.updatedField, new Date());
            }

            this._internalSaveModel(configuration, where, data, options, function (err, object) {
                if (!err) {
                    model.set(processor.parse(model, object));
                }

                callback(err, model);
            });

        },

        /***
         *
         * @param configuration
         * @param where
         * @param object
         * @param options
         * @param callback
         * @private
         */
        _internalSaveModel: function (configuration, where, object, options, callback) {
            callback && callback(null, {});
        },

        /***
         *
         * @param model
         * @param options
         * @param callback
         */
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

            this._internalLoadModel(configuration, where, function (err, object) {
                if (!err) {
                    model.set(processor.parse(model, object));
                }
                callback(err, model);
            });

        },

        _internalLoadModel: function (configuration, where, callback) {
            callback && callback(null, {});
        },

        /**
         *
         * @param model
         * @param options
         * @param callback
         */
        removeModel: function (model, options, callback) {
            var configuration = this._getConfigurationForModel(model);

            if (!configuration) {
                callback("No configuration found for " + model.constructor.name);
                return;
            }

            var where = this._getWhereConditionForModel(model);

            this._internalRemove(configuration, where, options, function (err) {
                callback && callback(err, model);
            });
        },

        /***
         *
         * @param collection
         * @param options
         * @param callback
         */
        countCollection: function (collection, options, callback) {
            var rootCollection = collection.getRoot(),
                modelClassName = rootCollection.$modelFactory.prototype.constructor.name,
                configuration = this.$dataSourceConfiguration.getConfigurationForModelClass(rootCollection.$modelFactory);

            if (!configuration) {
                callback("Couldn't find path config for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            var params = {};
            if (collection.$.query) {

                var queryComposer = this.getQueryComposer();
                if (queryComposer) {
                    params = queryComposer.compose(collection.$.query);
                }
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

            params.where = where;

            this._internalCountCollection(configuration, params, options, callback);
        },
        /***
         *
         * @param collectionPage
         * @param options
         * @param callback
         */
        loadCollectionPage: function (collectionPage, options, callback) {
            var rootCollection = collectionPage.getRoot(),
                modelClassName = rootCollection.$modelFactory.prototype.constructor.name,
                configuration = this.$dataSourceConfiguration.getConfigurationForModelClass(rootCollection.$modelFactory);

            if (!configuration) {
                callback("Couldn't find path config for " + rootCollection.$modelFactory.prototype.constructor.name);
            }

            var params = {};
            if (collectionPage.$collection.$.query) {
                // TODO: add schema
                var queryComposer = this.getQueryComposer();
                if (queryComposer) {
                    params = queryComposer.compose(collectionPage.$collection.$.query);
                }
            }

            // TODO: add query, fields and options
            var self = this,
                where = _.extend(this._getWhereConditionForCollection(rootCollection), params.where || {});


            var offset = collectionPage.$offset;
            var limit = collectionPage.$limit;

            // here we have a polymorphic type
            if (configuration.$.modelClassName !== modelClassName) {
                where[TYPE_KEY] = modelClassName;
            }

            params.where = where;
            params.offset = offset;
            params.limit = limit;


            flow()
                .seq("resultObject", function (cb) {
                    self._internalLoadCollectionPage(collectionPage, configuration, params, options, cb);
                })
                .exec(function (err, results) {
                    if (!err) {
                        var processor = self.getProcessorForCollection(rootCollection),
                            items,
                            resultObject = results.resultObject;
                        items = processor.parseCollection(rootCollection, resultObject.results, DataSource.ACTION.LOAD, options);
                        collectionPage.add(items);

                        collectionPage.$collection.$.$itemsCount = resultObject.count;
                    }

                    callback(err, collectionPage, options, callback);
                })
        },

        /**
         * The callback should return the count as the second argument
         * @param collectionPage
         * @param configuration
         * @param params
         * @param options
         * @param callback
         * @private
         */
        _internalLoadCollectionPage: function (collectionPage, configuration, params, options, callback) {
            callback && callback(null, {
                count: 0,
                results: []
            });
        },
        /***
         *
         * @param configuration
         * @param params
         * @param options
         * @param callback
         * @private
         */
        _internalCountCollection: function (configuration, params, options, callback) {
            callback && callback(null, 0);
        },
        /**
         * Returns the query composer for the specific DataSource
         * @returns {null}
         */
        getQueryComposer: function () {
            return null;
        },

        /**
         *
         * @param contextModel
         * @param properties
         * @param parentContext
         * @returns {KeyValueDataSource.Context}
         */
        createContext: function (contextModel, properties, parentContext) {
            return new KeyValueDataSource.Context(this, contextModel, properties, parentContext);
        }


    });

    KeyValueDataSource.Context = DataSource.Context.inherit("js.data.KeyValueDataSource.Context", {
        createCollection: function (factory, options, type) {
            options = options || {};
            _.defaults(options, {
                pageSize: this.$dataSource.$.collectionPageSize || 100
            });

            return this.callBase(factory, options, type);
        }
    });


    KeyValueDataSource.Processor = KeyValueDataSourceProcessor;

    KeyValueDataSource.ID_KEY = ID_KEY;

    return KeyValueDataSource;

});