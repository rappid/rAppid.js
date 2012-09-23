define(["require", "js/core/Component", "js/conf/Configuration", "js/core/Base", "js/data/Collection", "underscore", "js/data/Model", "js/data/Entity", "js/core/List", "flow", "JSON", "moment", "js/conf/DataSource", "js/conf/Resource", 'js/data/TypeResolver'],
    function (require, Component, Configuration, Base, Collection, _, Model, Entity, List, flow, JSON, moment, DataSourceConfiguration, ResourceConfiguration, TypeResolver) {

        var undefined,
            Context = Base.inherit("js.data.DataSource.Context", {

                defaults: {
                    collectionPageSize: null,
                    dateFormat: "YYYY-MM-DDTHH:mm:ssZ"
                },

                ctor: function (dataSource, properties, parentContext) {
                    this.callBase();

                    this.$contextCache = {};
                    this.$dataSource = dataSource;
                    this.$properties = properties;
                    this.$parent = parentContext;
                    this.$cache = {};

                },

                addEntityToCache: function (model) {
                    this.$cache[Context.generateCacheIdFromEntity(model)] = model;
                },

                addCollectionToCache: function (collection) {
                    this.$cache[Context.generateCacheIdFromCollection(collection)] = collection;
                },

                getInstanceByCacheId: function (cacheId) {
                    return this.$cache[cacheId];
                },

                getPathComponents: function () {
                    return [];
                },

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
                            // create new Entity
                            cachedItem = new factory({
                                id: id
                            });
                            // set context
                            cachedItem.$context = this;

                            // and add it to the cache
                            this.addEntityToCache(cachedItem);
                        }

                        return cachedItem;

                    } else {
                        throw "Factory has to be a function";
                    }
                },

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

                getContext: function (properties) {
                    var cacheId = this.createContextCacheId(properties);

                    if (!cacheId) {
                        // empty cacheId indicates the current context
                        return this;
                    }

                    if (!this.$contextCache.hasOwnProperty(cacheId)) {
                        this.$contextCache[cacheId] = this.$dataSource.createContext(properties, this);
                    }

                    return this.$contextCache[cacheId];
                },

                createContextCacheId: function (properties) {

                    var ret = [];
                    _.each(_.extend({}, properties), function (value, key) {
                        ret.push(key + "=" + value);
                    });

                    ret.sort();

                    if (ret.length === 0) {
                        return null;
                    }

                    return ret.join("&");
                }

            }, {

                generateCacheIdForCollection: function (type) {
                    return type;
                },

                generateCacheIdForEntity: function (type, id) {
                    return type + "_" + id;
                },

                generateCacheIdFromEntity: function (entity) {
                    return Context.generateCacheIdForEntity(entity.constructor.name, entity.$.id);
                },

                generateCacheIdFromCollection: function (collection) {
                    return Context.generateCacheIdForCollection(collection.$modelFactory.prototype.constructor.name);
                }

            });

        var Processor = Base.inherit("js.data.DataSource.Processor", {

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
             * @return {JSON}
             */
            compose: function (entity, action, options) {
                var ret = {},
                    data = entity.compose(action, options);

                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                        var value = this._getCompositionValue(data[key], key, action, options);

                        if (value !== undefined) {
                            ret[this._getReferenceKey(key, entity.$schema)] = value;
                        }
                    }
                }
                return ret;
            },

            _getReferenceKey: function (key, schema) {
                return key;
            },

            _composeObject: function (obj, action, options) {

                var ret = {};

                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        var value = this._getCompositionValue(obj[key], key, action, options);

                        if (value !== undefined) {
                            ret[key] = value;
                        }
                    }
                }

                return ret;
            },

            _getCompositionValue: function (value, key, action, options) {
                if (value instanceof Model) {
                    return this._composeSubModel(value, action, options);
                } else if (value instanceof Collection) {
                    return this._composeCollection(value, action, options);
                } else if (value instanceof Entity) {
                    return this._composeObject(value.compose(action, options), action, options);
                } else if (value instanceof List) {
                    var ret = [];
                    var self = this;
                    value.each(function (v, index) {
                        ret.push(self._getCompositionValue(v, index, action, options));
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
                        arr.push(this._getCompositionValue(value[i], i, action, options));
                    }
                    return arr;
                } else if (value instanceof Object) {
                    return this._composeObject(value);
                } else {
                    return value;
                }
            },

            _composeSubModel: function (model, action, options) {
                // TODO: implement compose SubModel
                // just return id
                return model.$.id;
            },

            _composeCollection: function (collection, action, options) {
                return undefined;
            },
            /**
             * Parses data for a given model
             * @param model
             * @param data
             * @param action
             * @param options
             * @return {*}
             */
            parse: function (model, data, action, options) {
                var schema = model.$schema;

                // convert top level properties to Models respective to there schema
                for (var key in schema) {
                    if (schema.hasOwnProperty(key)) {
                        if (data.hasOwnProperty(key)) {
                            // found key in data payload
                            var schemaType = schema[key],
                                value = this._getValueForKey(data, key, schemaType),
                                factory = null,
                                typeResolver,
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

                                if (value instanceof Array || value === null) {
                                    list = data[key] = new List();


                                    if (value) {
                                        for (i = 0; i < value.length; i++) {

                                            if (typeResolver) {
                                                factory = typeResolver.resolve(value[i], key);
                                            }

                                            if (!(factory && factory.classof(Entity))) {
                                                throw "Factory for type '" + key + "' isn't an instance of Entity";
                                            }

                                            entity = model.getContextForChild(factory).createEntity(factory, value[i].id);
                                            entity.set(this._parseModel(entity, value[i], action, options));
                                            list.add(entity);
                                        }
                                    }

                                } else {
                                    throw 'Schema for type "' + key + '" requires to be an array';
                                }


                            } else if (Collection && schemaType.classof(Collection)) {

                                var contextForChildren = model.getContextForChild(schemaType);
                                list = data[key] = contextForChildren.createCollection(schemaType, null);
                                list.set(value);

                                if (value instanceof Array || value === null) {
                                    for (i = 0; i < value.length; i++) {
                                        // create new entity based on collection type
                                        entity = contextForChildren.createEntity(list.$modelFactory);
                                        entity.set(this._parseModel(entity, value[i], action, options));
                                        // and add it to the collection
                                        list.add(entity);
                                    }
                                } else {
                                    // TODO: what here
//                                throw 'Schema for type "' + type + '" requires to be an array';
                                }
                            } else if (schemaType === Date && value) {
                                data[key] = moment(value, this.$dataSource.$.dateFormat);
                            } else if (schemaType.classof(Entity) && value) {
                                if (schemaType instanceof TypeResolver) {
                                    factory = schemaType.resolve(value, key);
                                } else {
                                    factory = schemaType || Entity;
                                }

                                if (!(factory && factory.classof(Entity))) {
                                    throw "Factory for type '" + key + "' isn't an instance of Entity";
                                }

                                data[key] = entity = model.getContextForChild(factory).createEntity(factory, value.id);
                                entity.set(this._parseModel(entity, value, action, options));
                            }
                        }
                    }
                }

                return model.parse(data);
            },

            _parseModel: function(model, data, action, options) {
                var processor = this.$dataSource.getProcessorForModel(model);
                return processor.parse(model, data, action, options);
            },

            parseCollection: function(collection, data, action, options) {
                if (!(data instanceof Array)) {
                    throw "data has to be an array";
                }

                var factory = collection.$modelFactory;

                for (var i = 0; i < data.length; i++) {
                    var value = data[i];
                    var entity = collection.getContextForChild(factory).createEntity(factory, value.id);
                    entity.set(this._parseModel(entity, value, action, options));
                    data[i] = entity;
                }

                return data;
            },

            /**
             * This method can be used to map payload values to the correct schema key
             * For example to map "company_id" to "company" : {id: "2"} ...
             *
             * @param data The payload data
             * @param key The schema key
             * @param schemaType The schema typ
             * @return {*} Returns the correct value for a reference and schemaType
             * @private
             */
            _getValueForKey: function (data, key, schemaType) {
                return data[key];
            },
            /***
             * saves sub models
             */
            saveSubModels: function (model, options, callback) {
                var schema = model.$schema, subModels = [], type;
                for (var reference in schema) {
                    if (schema.hasOwnProperty(reference)) {
                        type = schema[reference];
                        if (type.classof) {
                            // todo: add collection
                            if (type.classof(Model)) {
                                // TODO: clearify $nestedModels
                                if (model.$[reference] && _.include(model.$nestedModels, reference)) {
                                    subModels.push(model.$[reference]);
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
                                value.each(function (v) {
                                    getSubModel(v);
                                });
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

            ctor: function () {
                this.$dataSourceConfiguration = null;
                this.$configuredTypes = [];
                this.$rootContext = this.createContext();
                this.$formatProcessors = [];
                this.callBase();

                this.initializeFormatProcessors();
                this.initializeProcessors();

            },

            $processors: {},
            $entityFactory: Entity,
            $defaultProcessorFactory: Processor,
            $defaultProcessor: null,

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

            getConfigurationForModelClassName: function (modelClassName) {
                return this.$dataSourceConfiguration.getConfigurationForModelClassName(modelClassName);
            },

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
                if (childFactory) {
                    var configuration,
                        className = childFactory.prototype.constructor.name,
                        key;
                    if (childFactory.classof(Model)) {
                        configuration = this.getConfigurationForModelClassName(className);
                    } else if (childFactory.classof(Collection)) {
                        configuration = this.getConfigurationForCollectionClassName(className);
                    }

                    if (requestor instanceof Collection) {
                        key = "collectionClassName";
                    } else if (requestor instanceof Model) {
                        key = "modelClassName";
                    }

                    if (configuration) {

                        if (requestor) {
                            do {
                                configuration = configuration.$parent;

                                if (!(configuration instanceof ResourceConfiguration)) {
                                    break;
                                }

                                if (configuration.$[key] === requestor.constructor.name) {
                                    // childFactory is configured as descendant of the requestor
                                    // so the childFactory will be created in the context of the requestor
                                    return this.getContext(requestor, requestor.$context);
                                }

                            } while (configuration.$parent);
                        }


                        // childFactory isn't descendant of the requestor, so return the root context
                        return requestor.$context;
                    }
                }

                return null;
            },

            getContext: function (properties, parentContext) {

                if (!(properties && _.size(properties))) {
                    // no properties or empty object passed
                    return this.root();
                }

                parentContext = parentContext || this.root();
                return parentContext.getContext(properties);

            },

            /**
             * returns the root context
             */
            root: function () {
                return this.$rootContext;
            },

            createContext: function (properties, parentContext) {
                return new Context(this, properties, parentContext)
            },

            createEntity: function (factory, id, context) {
                context = context || this.getContext();

                return context.createEntity(factory, id);
            },

            createCollection: function (factory, options, context) {
                context = context || this.getContext();

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

            loadModel: function (model, options, callback) {
                if (callback) {
                    callback("Abstract method", model);
                }
            },

            /***
             *
             * @param list
             * @param options
             * @param callback
             */
            loadCollectionPage: function (list, options, callback) {
                if (callback) {
                    callback("Abstact method loadCollectionPage", list);
                }
            },

            saveModel: function (model, options, callback) {
                if (callback) {
                    callback("Abstract method saveModel", model);
                }
            },
            removeModel: function (model, options, callback) {
                if (callback) {
                    callback("Abstract method removeModel", model);
                }
            },

            getProcessorForModel: function (model, options) {
                var ret;
                if (model) {
                    ret = this.getProcessorForModelClassName(model.constructor.name, options);
                }

                return ret || this.$defaultProcessor;
            },

            getProcessorForModelClassName: function (modelClassName, options) {
                var config = this.getConfigurationForModelClassName(modelClassName);

                if (config && config.$.processor) {
                    var processorName = config.$.processor;
                    if (this.$processors[processorName]) {
                        return this.$processors[processorName];
                    } else {
                        throw "Processor for '" + processorName + "' not an instance of js.data.DataSource.Processor."
                    }
                }
            },

            getProcessorForCollection: function (collection, options) {
                var ret;
                if (collection && collection.$modelFactory) {
                    ret = this.getProcessorForModelClassName(collection.$modelFactory.prototype.constructor.name, options);
                }

                return ret || this.$defaultProcessor;
            },

            getFormatProcessor: function (action) {
                return this.$formatProcessors[0];
            },

            update: function (data, callback) {
            },

            find: function (data, callback) {
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
                return decodeURI(JSON.stringify(data));
            },
            deserialize: function (text) {
                return JSON.parse(text);
            },
            getContentType: function () {
                return "application/json";
            }
        });

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