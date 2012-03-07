var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.data.DataSource",
        ["js.core.Component", "js.core.Base"],
        function (Component, Base) {

        var Context = Base.inherit({
            ctor: function (datasource, properties, parentContext) {
                this.callBase();

                this.$datasource = datasource;
                this.$properties = properties;
                this.$parent = parentContext;
                this.$cache = {};
            },

            addToCache: function (model) {
                this.$cache[Context.generateCacheIdFromModel(model)] = model;
            },

            getModelByCacheId: function (cacheId) {
                return this.$cache[cacheId];
            },

            createModel: function (factory, id, type) {

                if (rAppid._.isFunction(factory)) {

                    type = type || factory.prototype.constructor.name;

                    var cachedItem = this.getModelByCacheId(Context.generateCacheId(type, id));

                    if (!cachedItem) {
                        // create new instance
                        cachedItem = new factory({
                            id: id
                        });
                        // set context
                        cachedItem.$context = this;
                        cachedItem.className = type;

                        // and add it to the cache
                        this.addToCache(cachedItem);
                    }

                    return cachedItem;

                } else {
                    throw "Factory has to be a function";
                }
            }
        });

        Context.generateCacheId = function (className, id) {
            return className + "_" + id;
        };

        Context.generateCacheIdFromModel = function (model) {
            return Context.generateCacheId(model.className, model.$.id);
        };

        var DataSource = Component.inherit({

            ctor: function () {
                this.callBase();

                this.$configuredTypes = [];
                this.$contextCache = {};
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
            root: function() {
                return this.getContext();
            },

            createContext: function(properties, parentContext) {
                return new Context(this, properties, parentContext)
            },

            createContextCacheId: function (properties, parentProperties) {
                var ret = [];
                rAppid._.each(rAppid._.extend({}, parentProperties, properties), function (value, key) {
                    ret.push(key + "=" + value);
                });

                rAppid._.sortBy(ret, function (value) {
                    return value;
                });

                return ret.join("&");
            },

            createModel: function (factory, id, type, context) {
                context = context || this.getContext();

                return context.createModel(factory, id, type);
            },

            /**
             * resolve references to models and collections
             * @param {JSON} data deserialized, parsed data
             * @param {Function} callback - function (err, resolvedData)
             */
            resolveReferences: function (data, callback) {
            },

            load: function (model, options, callback) {
                if (callback) {
                    callback("Abstract method", model);
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
})
;