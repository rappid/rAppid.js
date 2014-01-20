define(["js/core/Component", "underscore"], function (Component, _) {


    function factoryInheritsFrom(factory, type) {
        return factory == type || factory.prototype instanceof type;
    }

    return Component.inherit("js.core.Injection", {
        ctor: function (attributes, descriptor, stage, parentScope, rootScope, cidScope) {

            if (!stage.$injection) {
                this.$singletonInstanceCache = [];
                this.$factories = [];
            } else {
                this.$singletonInstanceCache = stage.$injection.$singletonInstanceCache;
                this.$factories = stage.$injection.$factories;

                this.callBase();
            }

        },

        _childrenInitialized: function () {
            this.callBase();

            for (var c = 0; c < this.$configurations.length; c++) {
                var config = this.$configurations[c];

                // TODO: TEST type of configuration
                this.addFactory(config.$);

            }
        },

        getInstance: function (type) {
            // TODO: add class hierarchy distance check
            var instance;

            if (_.isString(type)) {
                // inject by key
                if (this.$singletonInstanceCache.hasOwnProperty(type)) {
                    return this.$singletonInstanceCache[type];
                }
            } else {

                // go to the singleton instance and look for requested instance
                for (var key in  this.$singletonInstanceCache) {
                    if (this.$singletonInstanceCache.hasOwnProperty(key)) {
                        instance = this.$singletonInstanceCache[key];

                        if (instance instanceof type) {
                            return instance;
                        }
                    }
                }

                // instance not found -> go thought the factories
                for (var f = 0; f < this.$factories.length; f++) {
                    var factory = this.$factories[f];

                    if (factoryInheritsFrom(factory.factory, type)) {
                        // create instance
                        instance = new factory.factory();

                        if (instance instanceof type) {
                            if (factory.singleton) {
                                this.addInstance(instance);
                            }

                            return instance;
                        }
                    }
                }
            }


            throw "requested injection type not found";
        },

        addChild: function (child) {
            this.callBase(child);

            this.addInstance(child);
        },

        addFactory: function (factory) {

            if (factory instanceof Function) {
                factory = {
                    factory: factory
                };
            }

            _.defaults(factory, {
                "type": null,
                "factory": null,
                "singleton": false
            });

            if (!factory.factory) {
                // get factory from class
                var fac = this.$stage.$requirejsContext((factory.type || "").replace(/\./g, "/"));
                if (!fac) {
                    throw "factory for type '" + factory.type + "' not found";
                }
                factory.factory = fac;
            }

            this.$factories.push(factory);
        },

        /***
         *
         * @param {String} [key] a unique key
         * @param instance
         */
        addInstance: function (key, instance) {
            if (arguments.length == 1) {
                instance = key;
                key = null;
            }

            if (key) {
                this.$singletonInstanceCache[key] = instance;
            } else {
                this.$singletonInstanceCache.push(instance);
            }


        }
    });
});