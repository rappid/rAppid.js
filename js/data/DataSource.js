define(["js/core/Component", "js/core/Base", "js/data/Collection", "underscore", "js/data/Model", "js/data/Entity", "js/core/List", "flow", "JSON", "moment", "js/conf/DataSourceConfiguration", "js/conf/ResourceConfiguration", 'js/data/TypeResolver'],
    function (Component, Base, Collection, _, Model, Entity, List, flow, JSON, moment, DataSourceConfiguration, ResourceConfiguration, TypeResolver) {

        var undefined,
            Context = Base.inherit("js.data.DataSource.Context", {

                defaults: {
                    collectionPageSize: null
                },

                ctor: function (dataSource, contextModel, properties, parentContext) {

                    this.callBase();

                    this.$contextModel = contextModel;
                    this.$contextCache = {};
                    this.$dataSource = dataSource;
                    this.$properties = properties;
                    this.$parent = parentContext;
                    this.$cache = {};

                },

                /***
                 * Adds an entity to the cache
                 * @param {js.data.Entity} entity
                 */
                addEntityToCache: function (entity) {
                    this.$cache[Context.generateCacheIdFromEntity(entity)] = entity;
                },

                removeEntityFromCache: function (entity) {
                    this.$cache[Context.generateCacheIdFromEntity(entity)] = void 0;
                },

                /**
                 * Adds a collection to the cache
                 * @param {js.data.Collection} collection
                 */
                addCollectionToCache: function (collection) {
                    this.$cache[Context.generateCacheIdFromCollection(collection)] = collection;
                },

                /**
                 * returns null or the instance with the cacheId
                 * @param {String} cacheId
                 * @return {js.data.Entity}
                 */
                getInstanceByCacheId: function (cacheId) {
                    return this.$cache[cacheId];
                },

                /**
                 * Returns the path components of the context
                 * @return {Array}
                 */
                getPathComponents: function () {
                    return [];
                },

                /***
                 * Creates a new entity in the context or returns an existing one
                 * @param {Function} factory
                 * @param {String|Number} [id]
                 * @return {js.data.Entity}
                 */
                createEntity: function (factory, id) {

                    if (_.isFunction(factory)) {

                        var entityClassName = factory.prototype.constructor.name;

                        if (!entityClassName) {
                            throw new Error("No model class name defined");
                        }

                        var cachedItem;

                        // only get from cache if we got an id
                        if (id) {
                            cachedItem = this.getInstanceByCacheId(Context.generateCacheIdForEntity(entityClassName, id));
                        }

                        if (!cachedItem) {
                            var hash = {};
                            hash[factory.prototype.idField] = id;
                            // create new Entity
                            cachedItem = new factory(hash);

                            this.addEntity(cachedItem, true);
                        }

                        return cachedItem;

                    } else {
                        throw "Factory has to be a function";
                    }
                },

                addEntity: function (entity, addToCache) {

                    // set context
                    entity.$context = this;

                    // and add it to the cache
                    addToCache && this.addEntityToCache(entity);

                },

                /***
                 * Creates a collection in the context
                 * @param {Function} factory
                 * @param {Object} [options]
                 * @return {js.data.Collection}
                 */
                createCollection: function (factory, options) {
                    options = options || {};

                    if (_.isFunction(factory)) {
                        if (factory === this.$dataSource.$collectionFactory) {
                            throw new Error("Untyped collections not allowed");
                        }

                        var collectionClassName = factory.prototype.constructor.name;

                        if (!collectionClassName) {
                            throw new Error("No collection class name defined");
                        }

                        _.defaults(options, {
                            factory: factory
                        });

                        var cachedCollection = this.getInstanceByCacheId(Context.generateCacheIdForCollection(collectionClassName));

                        if (!cachedCollection) {
                            // create new Collection
                            cachedCollection = new factory(null, options);
                            // set context
                            cachedCollection.$context = this;

                            // and add it to the cache
                            this.addCollectionToCache(cachedCollection);
                        }

                        return cachedCollection;

                    } else {
                        throw "Factory has to be a function";
                    }
                },

                /***
                 * Returns the context for given properties
                 * @param {Object} properties
                 * @return {js.data.DataSource.Context}
                 */
                getContext: function (contextModel, properties) {
                    var cacheId = this.createContextCacheId(contextModel, properties);

                    if (!cacheId) {
                        // empty cacheId indicates the current context
                        return this;
                    }

                    if (!this.$contextCache.hasOwnProperty(cacheId)) {
                        this.$contextCache[cacheId] = this.$dataSource.createContext(contextModel, properties, this);
                    }

                    return this.$contextCache[cacheId];
                },

                /***
                 * Creates a cache id on base of given properties
                 * @param {Object} properties
                 * @return {String}
                 */
                createContextCacheId: function (contextModel, properties) {

                    var ret = [];

                    _.each(_.extend({}, properties), function (value, key) {
                        ret.push(key + "=" + value);
                    });

                    ret.sort();

                    if (contextModel) {
                        ret.unshift(Context.generateCacheIdFromEntity(contextModel));
                    }

                    if (ret.length === 0) {
                        return null;
                    }

                    return ret.join("&");
                },

                clear: function () {
                    this.$contextCache = {};
                }

            }, {

                generateCacheIdForCollection: function (type) {
                    return type;
                },

                generateCacheIdForEntity: function (type, id) {
                    return type + "_" + id;
                },

                generateCacheIdFromEntity: function (entity) {
                    return Context.generateCacheIdForEntity(entity.constructor.name, entity.$[entity.idField]);
                },

                generateCacheIdFromCollection: function (collection) {
                    return Context.generateCacheIdForCollection(collection.factory.prototype.constructor.name);
                }

            });

        var Processor = Base.inherit("js.data.DataSource.Processor", {
            /***
             * Processor constructor
             * @param {js.data.DataSource} dataSource
             */
            ctor: function (dataSource) {
                if (!dataSource) {
                    throw "dataSource is required for Processor";
                }

                this.$dataSource = dataSource;
            },

            /***
             * prepares the data for being serialized
             * @param {js.data.Entity} entity
             * @param {js.data.DataSource.ACTION} action
             * @return {JSON} options
             */
            compose: function (entity, action, options) {
                return this._composeEntity(entity, action, options);
            },
            /***
             * Composes a collection to an array of composed models
             * @param {js.data.Collection} collection
             * @param {String} action
             * @param {Object} options
             * @return {Array}
             */
            composeCollection: function (collection, action, options) {
                var results = [];
                var self = this,
                    includeInIndexCache = {};

                options = options || {};

                collection.each(function (item) {

                    var includeInIndex,
                        modelClassName = item.constructor.name;

                    if (modelClassName) {
                        if (includeInIndexCache.hasOwnProperty(modelClassName)) {
                            includeInIndex = includeInIndexCache[modelClassName];
                        } else {
                            includeInIndex = ["id"];

                            for (var key in item.schema) {
                                if (item.schema.hasOwnProperty(key)) {
                                    if (item.schema[key].includeInIndex === true) {
                                        includeInIndex.push(key);
                                    }
                                }
                            }

                            includeInIndexCache[modelClassName] = includeInIndex;
                        }
                    }

                    options.includeInIndex = includeInIndex;

                    results.push(self.compose(item, action, options));
                });

                return results;
            },
            /***
             * Returns the reference key for composing and parsing the schema
             * @param {String} key
             * @param {Function} schemaType
             * @return {*}
             * @private
             */
            _getReferenceKey: function (key, schemaType) {
                return key;
            },

            /***
             * Returns a composed object
             * @param {Object} object
             * @param {String} action
             * @param {Object} options
             * @return {Object}
             * @private
             */
            _composeObject: function (object, action, options) {
                var ret = {};
                for (var key in object) {
                    if (object.hasOwnProperty(key)) {
                        var value = this._getCompositionValue(object[key], key, action, options);

                        if (value !== undefined) {
                            ret[key] = value;
                        }
                    }
                }

                return ret;
            },
            /***
             * Returns the composed data for a value
             * @param {Object} value
             * @param {String} key
             * @param {String} action
             * @param {Object} options
             * @return {Object} composed data
             * @private
             */
            _getCompositionValue: function (value, key, action, options, scope) {
                if (value instanceof Model) {
                    return this._composeSubModel(value, action, options, scope);
                } else if (value instanceof Collection) {
                    return this._composeSubCollection(value, action, options, scope);
                } else if (value instanceof Entity) {
                    return this._composeEntity(value, action, options);
                } else if (value instanceof List) {
                    var ret = [];
                    var self = this;
                    value.each(function (v, index) {
                        ret.push(self._getCompositionValue(v, index, action, options, scope));
                    });
                    return ret;
                } else if (value instanceof Date) {
                    // TODO: remove dependency of moment
                    if (value) {
                        return moment(value).format(this.$dataSource.$.dateFormat);
                    } else {
                        return null;
                    }
                } else if (value instanceof Array) {
                    var arr = [];
                    for (var i = 0; i < value.length; i++) {
                        arr.push(this._getCompositionValue(value[i], i, action, options, scope));
                    }
                    return arr;
                } else if (value instanceof Object) {
                    return this._composeObject(value);
                } else {
                    return value;
                }
            },

            /**
             * Composes an entity, calls default compose method
             * @param entity
             * @param action
             * @param options
             * @return {JSON}
             * @private
             */
            _composeEntity: function (entity, action, options) {
                var ret = {},
                    data = entity.compose(action, options),
                    schemaDefinition,
                    schemaType,
                    isModel = entity instanceof Model,
                    factory = entity.factory;

                for (var key in entity.schema) {
                    if (entity.schema.hasOwnProperty(key) && (!isModel || (!options || !options.includeInIndex || _.contains(options.includeInIndex, key)))) {
                        schemaDefinition = entity.schema[key];
                        schemaType = schemaDefinition.type;


                        var value;
                        if (data[key] && schemaDefinition.isReference && schemaType.classof && schemaType.classof(Entity) && !schemaType.classof(Model)) {
                            value = {};
                            value[schemaType.prototype.idField] = data[key].identifier();
                        } else {
                            value = this._getCompositionValue(data[key], key, action, options, entity);
                        }
                        if (value !== undefined) {
                            ret[this._getReferenceKey(key, schemaType)] = value;
                        }
                    }
                }
                return ret;
            },

            /**
             * Composes a sub model
             * @param {js.data.Model} model
             * @param {String} action
             * @param {Object} options
             * @return {Object}
             * @private
             */
            _composeSubModel: function (model, action, options, scope) {
                // TODO: implement compose SubModel
                // just return id
                return model.identifier();
            },

            /***
             * Composes a collection. Returns undefined as collections are not composed into a model.
             * Can be overridden to nest collections
             * @param {js.data.Collection} collection
             * @param {String} action
             * @param {Object} options
             * @return {*}
             * @private
             */
            _composeSubCollection: function (collection, action, options) {
                return undefined;
            },
            /**
             * Parses data for a given model
             * @param {js.data.Model} model
             * @param {Object} data
             * @param {String} action
             * @param {Object} options
             * @return {Object}
             */
            parse: function (model, data, action, options) {
                var schema = model.schema,
                    schemaDefinition,
                    schemaType,
                    value,
                    factory,
                    newData = {};

                // convert top level properties to Models respective to there schema
                for (var key in schema) {
                    if (schema.hasOwnProperty(key)) {

                        schemaDefinition = schema[key];
                        schemaType = schemaDefinition.type;
                        value = this._getValueForKey(data, key, schemaType, schemaDefinition);

                        factory = null;
                        var typeResolver,
                            entity,
                            i,
                            list;
                        if (schemaType instanceof Array) {
                            if (schemaType.length === 1) {
                                typeResolver = schemaType[0];
                            } else if (schemaType.length === 0) {
                                this.log('ModelFactory for ListItem for "' + key + '" not defined', 'warn');
                                factory = Entity;
                            } else {
                                throw "Cannot determinate ModelFactory. Multiple factories defined for '" + key + "'.";
                            }

                            if (typeResolver instanceof Function) {
                                factory = typeResolver;
                                typeResolver = null;
                            }

                            if (value && value instanceof Array) {
                                // only create the list if items are there
                                list = newData[key] = new List();

                                for (i = 0; i < value.length; i++) {

                                    if (typeResolver) {
                                        factory = typeResolver.resolve(value[i], key);
                                    }

                                    if ((factory && factory.classof(Entity))) {
                                        entity = this.$dataSource._getContext(factory, model, value[i]).createEntity(factory, this._getIdForValue(value[i], factory));
                                        if (entity instanceof Entity && !(entity instanceof Model)) {
                                            entity.$parent = model;
                                            entity.$parentEntity = model;
                                        }
                                        entity.set(this._parseModel(entity, value[i], action, options));

                                        list.add(entity);
                                    } else {
                                        list.add(value[i]);
                                    }

                                }
                            }


                        } else if (!(schemaType instanceof TypeResolver) && Collection && schemaType.classof(Collection)) {
                            var contextForChildren = this.$dataSource._getContext(schemaType, model, value);
                            if (contextForChildren) {
                                if (model.$[key] instanceof Collection) {
                                    newData[key] = model.$[key];
                                    list = model.$[key];
                                } else {
                                    list = newData[key] = contextForChildren.createCollection(schemaType, (value instanceof Object) && !(value instanceof Array) ? value : null);
                                    list.$parent = contextForChildren.$contextModel;
                                }
                                if (value && value instanceof Array) {
                                    list.reset(this.parseCollection(list, value, action, options));
                                }

                            }
                        } else if (schemaType === Date && value && !(value instanceof Date)) {
                            newData[key] = moment(value, this.$dataSource.$.dateFormat).toDate();
                        } else if (schemaType instanceof TypeResolver || schemaType.classof(Entity)) {
                            var id;
                            if (value && schemaType instanceof TypeResolver) {
                                factory = schemaType.resolve(value, key);
                            } else {
                                factory = schemaType || Entity;
                            }

                            if (!(factory && factory.classof(Entity))) {
                                throw "Factory for type '" + key + "' isn't an instance of Entity";
                            }

                            if (factory.classof(Model) && factory.prototype.$isDependentObject) {
                                id = key;
                                value = value || {};
                            } else if (value) {
                                id = this._getIdForValue(value, factory);
                            }
                            if (value) {
                                newData[key] = entity = this.$dataSource._getContext(factory, model, value).createEntity(factory, id);
                                if (entity instanceof Entity && !(entity instanceof Model)) {
                                    entity.$parent = model;
                                    entity.$parentEntity = model;
                                }
                                entity.set(this._parseModel(entity, value, action, options));
                            }

                        }
                    }
                }

                // add all values that are not defined in schema ...
                _.defaults(newData, data);

                return model.parse(newData);
            },

            _getIdForValue: function (value, factory) {
                return value[factory.prototype.idField];
            },

            /***
             * Parses the data to a given model
             * @param {js.data.Model} model The model which provides the schema
             * @param {Object} data The data to parse
             * @param {String} action
             * @param {Object} options
             * @return {*}
             * @private
             */
            _parseModel: function (model, data, action, options) {
                var processor = this.$dataSource.getProcessorForModel(model);
                return processor.parse(model, data, action, options);
            },
            /***
             * Parses the data to a given collection
             * @param {js.data.Collection} collection
             * @param {Object} data
             * @param {String} action
             * @param {Object} options
             * @return {*}
             */
            parseCollection: function (collection, data, action, options) {
                if (!(data instanceof Array)) {
                    throw "data has to be an array";
                }
                var context,
                    entity,
                    newData = [];
                for (var i = 0; i < data.length; i++) {
                    var value = data[i];
                    if (!(value instanceof Model)) {
                        // this is needed to determine the right context for collection models that are just links inside the collection
                        context = this.$dataSource._getContext(collection.$modelFactory, collection, value);
                        entity = context.createEntity(collection.$modelFactory, this._getIdForValue(value, collection.$modelFactory));
                        entity.set(this._parseModel(entity, value, action, options));
                        newData.push(entity);
                    }
                }

                return newData;
            },

            /**
             * This method can be used to map payload values to the correct schema key
             * For example to map "company_id" to "company" : {id: "2"} ...
             *
             * @param {Object} data The payload data
             * @param {String} key The schema key
             * @param {Function} schemaType The schema typ
             * @param {Object} schemaDefinition
             * @return {*} Returns the correct value for a reference and schemaType
             * @private
             */
            _getValueForKey: function (data, key, schemaType, schemaDefinition) {

                if (schemaDefinition && schemaDefinition.key) {
                    key = schemaDefinition.key;
                }

                return data[key];
            },
            /***
             * saves sub models
             */
            saveSubModels: function (model, options, callback) {
                var schema = model.schema,
                    subModels = [],
                    type,
                    subCollection,
                    subModel,
                    addSubModel = function (model) {
                        subModels.push(model);
                    };

                for (var reference in schema) {
                    if (schema.hasOwnProperty(reference)) {
                        type = schema[reference];
                        if (type.classof) {
                            // TODO: remove $nestedModels and use options to specify, which subModels should also be saved
                            // This depends on the changes of the model.
                            // If the submodels haven't changed, than there is no need to save sub models/collections.
                            if (type.classof(Model)) {
                                subModel = model.$[reference];
                                if (subModel && _.include(model.$nestedModels, reference)) {
                                    subModels.push(subModel);
                                }
                            } else if (type.classof(Collection)) {
                                subCollection = model.$[reference];
                                if (subCollection) {
                                    subCollection.each(addSubModel);
                                }
                            }
                        }

                    }
                }

                flow()
                    .parEach(subModels, function (model, cb) {
                        model.save(options, cb);
                    })
                    .exec(callback);
            },
            /***
             * Returns all sub models, which should be saved afterwards the model is saved
             * @param {js.data.Model} model
             * @return {Array}
             */
            getSubModelsForModel: function (model) {

                var ret = [];

                function getSubModel(obj) {

                    if (obj === model) {
                        return;
                    }

                    if (_.indexOf(ret, obj) !== -1) {
                        // already in list
                        return;
                    }

                    if (obj instanceof Model) {
                        ret.push(obj);
                        return;
                    }

                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            var value = obj[key];

                            if (value instanceof Array) {
                                for (var i = 0; i < value.length; i++) {
                                    getSubModel(value[i]);
                                }
                            } else if (value instanceof List) {
                                value.each(getSubModel);
                            } else if (value instanceof Object) {
                                getSubModel(value);
                            }
                        }
                    }
                }

                getSubModel(model.$);

                return ret;

            }
        });

        var DataSource = Component.inherit('js.data.DataSource', {

            $processors: {},
            $entityFactory: Entity,
            $defaultProcessorFactory: Processor,
            $defaultProcessor: null,

            defaults: {
                dateFormat: "YYYY-MM-DDTHH:mm:ssZ"
            },

            ctor: function () {
                this.$dataSourceConfiguration = null;
                this.$configuredTypes = [];
                this.$rootContext = this.createContext();
                this.$formatProcessors = [];
                this.callBase();

                this.initializeFormatProcessors();
                this.initializeProcessors();

            },

            initializeFormatProcessors: function () {
                // hook
            },

            initializeProcessors: function () {
                this.$defaultProcessor = new this.$defaultProcessorFactory(this);

                for (var key in this.$processors) {
                    if (this.$processors.hasOwnProperty(key) && this.$processors[key] instanceof Function) {
                        // Factory instead of instance, create processor instance
                        this.$processors[key] = new (this.$processors[key])(this);
                    }
                }
            },

            composeModel: function (model, options) {
                var processor = this.getProcessorForModel(model, options);

                return processor.compose(model, DataSource.ACTION.CREATE, options);
            },

            parseModel: function (model, data, options) {
                var processor = this.getProcessorForModel(model, options);

                model.set(processor.parse(model, data, DataSource.ACTION.CREATE, options));
                return model;
            },

            _childrenInitialized: function () {
                this.callBase();

                for (var c = 0; c < this.$configurations.length; c++) {
                    var config = this.$configurations[c];
                    if (config instanceof DataSourceConfiguration) {
                        this.$dataSourceConfiguration = config;
                        break;
                    }
                }

                this._validateConfiguration();
            },

            _validateConfiguration: function () {
                // hook
            },

            getConfigurationForModelClass: function (modelClass) {
                return this.$dataSourceConfiguration.getConfigurationForModelClass(modelClass);
            },

            /***
             * Returns the configuration for a collectionclass name
             * @param collectionClassName
             * @return {*}
             */
            getConfigurationForCollectionClassName: function (collectionClassName) {
                return this.$dataSourceConfiguration.getConfigurationForCollectionClassName(collectionClassName);
            },
            /***
             *
             * @param {Function} childFactory
             * @param {js.data.Entity|js.data.Collection} requestor
             * @return {*}
             */
            getContextForChild: function (childFactory, requestor) {
                var context;
                if (childFactory) {

                    var configuration,
                        requestorConfiguration,
                        baseConfiguration = this,
                        isModel = childFactory.classof(Model);

                    context = this.root();

                    if (requestor) {
                        var requestorContext = requestor.$context,
                            contextStack = [];
                        // find correct configuration of requestor
                        while (requestorContext.$contextModel) {
                            contextStack.push(requestorContext);
                            requestorContext = requestorContext.$contextModel.$context;
                        }
                        var rootConfiguration = this,
                            rootContext;
                        while (contextStack.length > 0 && rootConfiguration) {
                            rootContext = contextStack.pop();
                            rootConfiguration = rootConfiguration.getConfigurationForModelClass(rootContext.$contextModel.factory);
                        }
                        var factory = requestor.factory;
                        if (factory.classof(Model)) {
                            requestorConfiguration = rootConfiguration.getConfigurationForModelClass(factory);
                        } else if (factory.classof(Collection)) {
                            requestorConfiguration = rootConfiguration.getConfigurationForCollectionClassName(factory.prototype.$modelFactory);
                        }
                        // starting from the requestors configuration, find correct context of the childFactory
                        if (requestorConfiguration) {
                            context = this.getContextByProperties(requestor, null, requestor.$context);
                            baseConfiguration = requestorConfiguration;
                        }
                        while (baseConfiguration.$parent && context) {
                            if (isModel) {
                                configuration = baseConfiguration.getConfigurationForModelClass(childFactory);
                            } else {
                                configuration = baseConfiguration.getConfigurationForModelClass(childFactory.prototype.$modelFactory);
                            }
                            if (configuration) {
                                // found context
                                break;
                            } else {
                                context = context.$contextModel ? context.$contextModel.$context : null;
                                baseConfiguration = baseConfiguration.$parent;
                            }
                        }
                    }
                }
                return context || this.root();
            },

            generateCacheKeyForContext: function (childFactory) {
                var factory = childFactory;
                if (childFactory.classof(Collection)) {
                    factory = childFactory.prototype.$modelFactory;
                }
                return factory.prototype.constructor.name;
            },

            /***
             * Returns the context for a properties object
             * @param {js.data.Model} contextModel
             * @param {Object} properties
             * @param {js.data.DataSource.Context} [parentContext]
             * @return {js.data.DataSource.Context}
             */
            getContextByProperties: function (contextModel, properties, parentContext) {

                if (!(contextModel || properties && _.size(properties))) {
                    // no contextModel OR no properties or empty object passed
                    return this.root();
                }

                parentContext = parentContext || this.root();
                return parentContext.getContext(contextModel, properties);

            },

            /***
             * Returns the root context of the data source
             * @return {js.data.DataSource.Context} context
             */
            root: function () {
                return this.$rootContext;
            },

            /***
             * Creates a context with the given properties
             * @param {Object} properties
             * @param {js.data.DataSource.Context} [parentContext]
             * @return {js.data.DataSource.Context}
             */
            createContext: function (contextModel, properties, parentContext) {
                return new Context(this, contextModel, properties, parentContext);
            },

            /***
             * Create an instance of {js.data.Entity}
             * @param {Function} factory
             * @param {String|Number} [id]
             * @param {js.data.DataSource.Context} [context]
             * @return {js.data.Entity|js.data.Model}
             */
            createEntity: function (factory, id, context) {
                context = context || this.getContextByProperties();
                return context.createEntity(factory, id);
            },

            /***
             * Create an instance of {js.data.Model}
             * @param {Function} factory
             * @param {String|Number} [id]
             * @param {js.data.DataSource.Context} [context]
             * @return {js.data.Model}
             */
            createModel: function (factory, id, context) {
                return this.createEntity(factory, id, context);
            },

            /***
             * Creates a collection by a given factory in a caching context
             * @param {Function} factory The factory
             * @param {Object} [options]
             * @param {js.data.DataSource.Context} [context]
             * @return {js.data.Collection}
             */
            createCollection: function (factory, options, context) {
                context = context || this.getContextByProperties();

                return context.createCollection(factory, options);
            },

            /**
             * resolve references to models and collections
             * @param {js.data.Model} model
             * @param {JSON} data deserialized, parsed data
             * @param {Object} options
             * @param {Function} callback - function (err, resolvedData)
             */
            resolveReferences: function (model, data, options, callback) {
                if (callback) {
                    callback("Abstract method", data);
                }
            },

            /**
             * Loads the data for a given model. (abstract)
             * This method is called by model.fetch()
             * @param {js.data.Model} model
             * @param {Object} options
             * @param {Function} callback
             */
            loadModel: function (model, options, callback) {
                if (callback) {
                    callback("Abstract method", model);
                }
            },

            /***
             * Same as loadModel, but for a collection page
             * @param {js.data.Collection} list
             * @param {Object} options
             * @param {Function} callback
             */
            loadCollectionPage: function (list, options, callback) {
                if (callback) {
                    callback("Abstact method loadCollectionPage", list);
                }
            },

            countCollection: function (collection, options, callback) {
                callback && callback("Abstrat method countCollection", NaN);
            },

            /***
             * Saves a model
             * @param {js.data.Model} model
             * @param {Object} options
             * @param {Function} callback
             */
            saveModel: function (model, options, callback) {

                var self = this;

                flow()
                    .seq(function (cb) {
                        self._beforeModelSave(model, options, cb);
                    })
                    .seq("result", function (cb) {
                        self._saveModel(model, options, cb);
                    })
                    .seq(function (cb) {
                        self._afterModelSave(this.vars.result || model, options, cb);
                    })
                    .exec(function (err, results) {
                        callback && callback(err, results.result || model, options);
                    });
            },

            _beforeModelSave: function (model, options, callback) {
                callback && callback();
            },

            _saveModel: function (model, options, callback) {
                if (callback) {
                    callback("Abstract method saveModel", model);
                }
            },

            _afterModelSave: function (model, options, callback) {
                callback && callback();
            },

            /***
             * Removes a model
             * @param {js.data.Model} model
             * @param {Object} options
             * @param {Function} callback
             */
            removeModel: function (model, options, callback) {
                if (callback) {
                    callback("Abstract method removeModel", model);
                }
            },

            /***
             * Returns the correct processor for model
             *
             * @param {js.data.Model} model
             * @param {Object} [options]
             * @return {js.data.DataSource.Processor} processor
             */
            getProcessorForModel: function (model, options) {
                var ret;
                if (model) {
                    ret = this.getProcessorForModelClass(model.factory, options);
                }

                return ret || this.$defaultProcessor;
            },

            /***
             * Returns the correct processor for model class
             *
             * @param {String} modelClassName
             * @param {Object} [options]
             * @return {js.data.DataSource.Processor} processor
             */
            getProcessorForModelClass: function (modelClass, options) {
                var config = this.getConfigurationForModelClass(modelClass);

                if (config && config.$.processor) {
                    var processorName = config.$.processor;
                    if (this.$processors[processorName]) {
                        return this.$processors[processorName];
                    } else {
                        throw "Processor for '" + processorName + "' not an instance of js.data.DataSource.Processor.";
                    }
                }
            },

            /***
             * Returns the correct processor for a collection
             *
             * @param {js.data.Collection} collection
             * @param {Object} [options]
             * @return {js.data.DataSource.Processor} processor
             */
            getProcessorForCollection: function (collection, options) {
                var ret;
                if (collection && collection.$modelFactory) {
                    ret = this.getProcessorForModelClass(collection.$modelFactory, options);
                }

                return ret || this.$defaultProcessor;
            },

            /**
             * Returns the format processor
             * @param {String} [action]
             * @return {*}
             */
            getFormatProcessor: function (action) {
                return this.$formatProcessors[0];
            },

            clone: function () {
                var ret = this.callBase();
                ret.$dataSourceConfiguration = this.$dataSourceConfiguration;
                return ret;
            },

            _getContext: function (factory, parent, data) {
                if (factory.classof) {
                    if (factory.classof(Collection)) {
                        return parent.getContextForChild(factory);
                    } else if (factory.classof(Model)) {
                        return parent.getContextForChild(factory);
                    } else if (factory.classof(Entity)) {
                        return parent.getContextForChild(factory);
                    }
                }
                return null;
            },

            _translateQueryObject: function (queryObject) {
                return queryObject;
            }
        });

        DataSource.FormatProcessor = Base.inherit("js.data.DataSource.FormatProcessor", {
            serialize: function (data) {
                throw "abstract method";
            },
            deserialize: function (responses) {
                throw "abstract method";
            },
            getContentType: function () {
                throw "abstract method";
            }
        });

        DataSource.JsonFormatProcessor = DataSource.FormatProcessor.inherit("js.data.DataSource.JsonFormatProcessor", {
            serialize: function (data) {
                return JSON.stringify(data);
            },
            deserialize: function (text) {
                return JSON.parse(text);
            },
            getContentType: function () {
                return "application/json; charset=UTF-8";
            }
        });

        DataSource.ERROR = {
            NOT_FOUND: "not_found"
        };

        DataSource.Context = Context;

        DataSource.Processor = Processor;

        DataSource.ACTION = {
            LOAD: 'load',
            CREATE: 'create',
            UPDATE: 'update',
            DELETE: 'delete'
        };

        DataSource.IdGenerator = {
            genId: (function (uuidRegEx, uuidReplacer) {
                return function () {
                    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(uuidRegEx, uuidReplacer).toUpperCase();
                };
            })(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0,
                    v = c == "x" ? r : (r & 3 | 8);
                return v.toString(16);
            })
        };

        return DataSource;
    });