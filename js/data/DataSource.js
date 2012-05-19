define(["js/core/Component", "js/core/Base", "js/data/Collection", "underscore", "js/data/Model", "js/data/Entity"],
    function (Component, Base, Collection, _, Model, Entity) {

        var Context = Base.inherit("js.data.DataSource", {

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


            createEntity: function (factory, id, alias) {

                if (_.isFunction(factory)) {

                    var entityClassName = factory.prototype.constructor.name;
                    alias = alias || (factory.classof(Model) ? this.$datasource.getAliasForModelClassName(entityClassName) : entityClassName);

                    if (factory.classof(Model) && !alias) {
                        throw "Alias for '" + entityClassName + "' not found";
                    }

                    var cachedItem = this.getInstanceByCacheId(Context.generateCacheId(alias, id));

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

                    var cachedCollection = this.getInstanceByCacheId(Context.generateCacheId(alias));

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

        Context.generateCacheId = function (type, id) {
            if (id) {
                return type + "_" + id;
            } else {
                return type;
            }
        };

        Context.generateCacheIdFromEntity = function (entity) {
            return Context.generateCacheId(entity.$alias, entity.$.id);
        };

        Context.generateCacheIdFromCollection = function (collection) {
            return Context.generateCacheId(collection.className);
        };

        var DataSource = Component.inherit({

            ctor: function () {

                this.$configuredTypes = [];
                this.$contextCache = {};
                this.$processors = [];

                this.callBase();

                this.initializeProcessors();
            },


            $modelFactory: Model,
            $entityFactory: Entity,
            $collectionFactory: Collection,

            initializeProcessors: function () {
                // hook
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

                _.sortBy(ret, function (value) {
                    return value;
                });

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

            saveModel: function(model, options, callback) {
                if (callback) {
                    callback("Abstract method saveModel", model);
                }
            },

            update: function (data, callback) {
            },
            remove: function (data, callback) {
            },
            find: function (data, callback) {
            }
        });

        DataSource.Context = Context;

        return DataSource;
    });