define(["require", "js/core/Component", "js/core/Base", "js/data/Collection", "underscore", "js/data/Model", "js/data/Entity", "js/core/List", "flow", "JSON"],
    function (require, Component, Base, Collection, _, Model, Entity, List, flow, JSON) {

        var undefined,
            Context = Base.inherit("js.data.DataSource.Context", {

                defaults: {
                    collectionPageSize: null
                },

                ctor: function (dataSource, properties, parentContext) {
                    this.callBase();

                    this.$datasource = dataSource;
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

                createEntity: function (factory, id, alias) {

                    if (_.isFunction(factory)) {

                        var entityClassName = factory.prototype.constructor.name;
                        alias = alias || (factory.classof(Model) ? this.$datasource.getAliasForModelClassName(entityClassName) : entityClassName);

                        if (factory.classof(Model) && !alias) {
                            throw "Alias for '" + entityClassName + "' not found";
                        }

                        var cachedItem;

                        // only get from cache if we got an id
                        if (id) {
                            cachedItem = this.getInstanceByCacheId(Context.generateCacheIdForEntity(alias, id));
                        }

                        if (!cachedItem) {
                            // create new Entity
                            cachedItem = new factory({
                                id: id
                            });
                            // set context
                            cachedItem.$context = this;
                            cachedItem.$alias = alias;

                            // and add it to the cache
                            this.addEntityToCache(cachedItem);
                        }

                        return cachedItem;

                    } else {
                        throw "Factory has to be a function";
                    }
                },

                createCollection: function (factory, options, alias) {
                    options = options || {};

                    if (_.isFunction(factory)) {

                        var collectionClassName = factory.prototype.constructor.name;
                        alias = alias || this.$datasource.getAliasForCollectionClassName(collectionClassName);

                        if (!alias) {
                            throw "Alias for '" + collectionClassName + "' not found";
                        }

                        _.defaults(options, {
                            factory: factory,
                            type: alias
                        });

                        var cachedCollection = this.getInstanceByCacheId(Context.generateCacheIdForCollection(alias));

                        if (!cachedCollection) {
                            // create new Collection
                            cachedCollection = new factory(null, options);
                            // set context
                            cachedCollection.$context = this;
                            cachedCollection.$alias = alias;

                            // and add it to the cache
                            this.addCollectionToCache(cachedCollection);
                        }

                        return cachedCollection;

                    } else {
                        throw "Factory has to be a function";
                    }
                }
            });

        Context.generateCacheIdForCollection = function (type) {
            return type;
        };

        Context.generateCacheIdForEntity = function (type, id) {
            return type + "_" + id;
        };

        Context.generateCacheIdFromEntity = function (entity) {
            return Context.generateCacheIdForEntity(entity.$alias, entity.$.id);
        };

        Context.generateCacheIdFromCollection = function (collection) {
            return Context.generateCacheIdForCollection(collection.$alias);
        };

        var Processor = Base.inherit("js.data.DataSource.Processor", {

            ctor: function (dataSource) {
                if (!dataSource) {
                    throw "dataSource is required for Processor";
                }

                this.$datasource = dataSource;
            },

            /***
             * prepares the data for being serialized
             * @param {JSON} data
             * @param {js.data.DataSource.ACTION} action
             * @return {JSON}
             */
            compose: function (data, action, options) {
                return this._composeObject(data, action, options);
            },

            _composeObject: function (obj, action, options) {

                var ret = {};

                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        var value = this._getCompositionValue(obj[key], action, options);

                        if (value !== undefined) {
                            ret[key] = value;
                        }
                    }
                }

                return ret;
            },

            _getCompositionValue: function (value, action, options) {
                if (value instanceof Model) {
                    return this._composeSubModel(value, action, options);
                } else if (value instanceof Collection) {
                    return this._composeCollection(value, action, options);
                } else if (value instanceof Entity) {
                    return value.compose(action, options);
                } else if (value instanceof List) {
                    var ret = [];
                    var self = this;
                    value.each(function (v) {
                        ret.push(self._getCompositionValue(v, action, options));
                    });
                    return ret;
                } else if (value instanceof Object) {
                    return this._composeObject(value);
                }
                else {
                    return value;
                }
            },

            _composeSubModel: function (model, action, options) {
                return model.compose(action, options);
            },

            _composeCollection: function (collection, action, options) {
                return undefined;
            },

            parse: function (data, action, options) {
                return data;
            },

            /***
             * saves sub models
             */
            saveSubModels: function (model, options, callback) {
                // TODO: handle circular dependencies

//                flow()
//                    .parEach(this.getSubModelsForModel(model), function(model, cb) {
//                        model.save(options, cb);
//                    })
//                    .exec(callback);

                // TODO: uncomment
                callback();
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

                this.$configuredTypes = [];
                this.$contextCache = {};
                this.$formatProcessors = [];

                this.callBase();

                this.initializeFormatProcessors();
                this.initializeProcessors();

            },

            $processors: {},
            $modelFactory: Model,
            $entityFactory: Entity,
            $collectionFactory: Collection,
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
                    this.addTypeConfiguration(config);

                }
            },

            getAliasForModelClassName: function (modelClassName) {

                for (var i = 0; i < this.$configuredTypes.length; i++) {
                    var config = this.$configuredTypes[i];
                    if (config.$.modelClassName === modelClassName) {
                        return config.$.alias;
                    }
                }

                return null;
            },

            getAliasForCollectionClassName: function (collectionClassName) {
                for (var i = 0; i < this.$configuredTypes.length; i++) {
                    var config = this.$configuredTypes[i];
                    if (config.$.collectionClassName === collectionClassName) {
                        return config.$.alias;
                    }
                }

                return null;
            },


            addTypeConfiguration: function (configuration) {

                if (!configuration.$.modelClassName && !configuration.$.alias) {
                    throw "neither modelClassName nor alias defined";
                }

                if (configuration.$.modelClassName && !configuration.$.alias) {
                    configuration.$.alias = configuration.$.modelClassName.split(".").pop();
                }

                if (!configuration.$.modelClassName) {
                    configuration.$.modelClassName = "js.data.Model";
                }

                this.$configuredTypes.push(configuration);
            },

            getFqClassName: function (alias) {

                for (var i = 0; i < this.$configuredTypes.length; i++) {
                    var typeConfig = this.$configuredTypes[i];

                    if (typeConfig.$.alias == alias) {
                        return typeConfig.$.modelClassName;
                    }
                }
            },

            getContext: function (properties, parentContext) {

                var cacheId = this.createContextCacheId(properties, parentContext ? parentContext.$properties : null);

                if (!this.$contextCache.hasOwnProperty(cacheId)) {
                    this.$contextCache[cacheId] = this.createContext(properties, parentContext);
                }

                return this.$contextCache[cacheId];
            },

            /**
             * returns the root context
             */
            root: function () {
                return this.getContext();
            },

            createContext: function (properties, parentContext) {
                return new Context(this, properties, parentContext)
            },

            createContextCacheId: function (properties, parentProperties) {
                var ret = [];
                _.each(_.extend({}, parentProperties, properties), function (value, key) {
                    ret.push(key + "=" + value);
                });

                ret.sort();

                if (ret.length == 0) {
                    return "root";
                }

                return ret.join("&");
            },

            createEntity: function (factory, id, type, context) {
                context = context || this.getContext();

                return context.createEntity(factory, id, type);
            },

            createCollection: function (factory, options, type, context) {
                context = context || this.getContext();

                return context.createCollection(factory, options, type);
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

            /***
             * returns the configuration entry for the model class
             * @param modelClassName
             * @return {Configuration} configuration matching the model class name
             */
            getConfigurationForModelClass: function (modelClassName) {

                // TODO: cache
                for (var i = 0; i < this.$configuredTypes.length; i++) {
                    var config = this.$configuredTypes[i];
                    if (config.$.modelClassName === modelClassName) {
                        return config;
                    }
                }

                return null;
            },

            /***
             *
             * returns a configuration entry by matching the alias
             *
             * @param alias
             * @return {*}
             */
            getConfigurationByAlias: function (alias) {

                // TODO: cache it
                for (var i = 0; i < this.$configuredTypes.length; i++) {
                    var config = this.$configuredTypes[i];
                    if (config.$.alias === alias) {
                        return config;
                    }
                }

                return null;
            },

            getProcessorForModel: function (model, options) {

                if (model) {
                    var config;
                    if (model.constructor === this.$modelFactory) {
                        // default model -> working with alias
                        config = this.getConfigurationByAlias(model.$alias);
                    } else {
                        config = this.getConfigurationForModelClass(model.$modelClassName);
                    }

                    if (config && config.$.processor) {
                        var processorName = config.$.processor;
                        if (this.$processors[processorName]) {
                            return this.$processors[processorName];
                        } else {
                            throw "Processor for '" + processorName + "' not an instance of js.data.DataSource.Processor."
                        }
                    }
                }

                return this.$defaultProcessor;
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
            getContentType: function(){
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
            getContentType: function(){
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