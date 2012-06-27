define(["require", "js/core/UIComponent", "js/ui/ContentPlaceHolder", "js/core/Module", "underscore", "js/conf/Module", "flow"],
    function (require, UIComponent, ContentPlaceHolder, Module, _, ModuleConfiguration, flow) {
        var ModuleLoader = UIComponent.inherit("js.core.ModuleLoader", {

            $classAttributes: ['router', 'currentModuleName'],
            defaults: {
                currentModuleName:  null
            },

            ctor: function (attributes) {
                this.callBase();
                this.$modules = {};
                this.$moduleCache = {};
            },

            _initializationComplete: function () {
                this.callBase();

                for (var i = 0; i < this.$configurations.length; i++) {
                    var config = this.$configurations[i];

                    if (config instanceof ModuleConfiguration) {
                        this.addModule(config.$);
                    }
                }
            },

            /***
             * adds a module to the list of known modules
             *
             * @param {js.conf.Module} module
             */
            addModule: function (module) {
                _.defaults(module, {
                    name: null,
                    moduleClass: null,
                    route: null
                });

                if (!module.name) {
                    throw "module cannot be added: module name is required";
                }

                if (!module.moduleClass) {
                    throw "no moduleClass defined for module";
                }

                if (this.$modules.hasOwnProperty(module.name)) {
                    throw "module with name '" + module.name + "' already registered"
                }

                this.$modules[module.name] = module;

                if (module.route) {
                    if (!this.$.router) {
                        throw "defining modules with routes requires a router instance to be set"
                    }

                    var self = this;
                    this.$.router.addRoute({
                        name: module.name,
                        route: module.route,
                        fn: function (routeContext) {

                            // route triggered -> load module
                            self.loadModule(module, routeContext.callback, routeContext);
                        }.async()
                    });
                }

            },

            _startModule: function (moduleName, moduleInstance, callback, routeContext, cachedInstance) {

                this.set('currentModuleName',moduleName);

                var contentPlaceHolders = this.getContentPlaceHolders();

                // set content
                for (var i = 0; i < contentPlaceHolders.length; i++) {
                    var contentPlaceHolder = contentPlaceHolders[i];
                    contentPlaceHolder.set("content", moduleInstance.findContent(contentPlaceHolder.$.name));
                }

                var internalCallback = function(err) {
                    if (callback) {
                        callback(err);
                    }
                };

                // start module
                moduleInstance.start(function (err) {

                    if (err || cachedInstance) {
                        internalCallback(err);
                    } else {
                        if (routeContext) {
                            // fresh instance with maybe new routers -> exec routes for new router
                            var routeExecutionStack = [];

                            for (var i = 0; i < moduleInstance.$routers.length; i++) {
                                routeExecutionStack = routeExecutionStack.concat(moduleInstance.$routers[i].generateRoutingStack(routeContext.fragment));
                            }

                            flow()
                                .seqEach(routeExecutionStack, function(routingFunction, cb) {
                                    routingFunction(cb);
                                })
                                .exec(internalCallback);

                        } else {
                            internalCallback();
                        }

                    }
                }, routeContext);

            },

            /***
             * loads an module instance into the module loader and starts the module
             *
             * @param {js.conf.Module} module - the module to load
             * @param {Function} [callback] - a callback function which gets invoked after the module is loaded or an error occurred
             * @param {js.core.Router.RouteContext} [routeContext]
             */
            loadModule: function (module, callback, routeContext) {
                if (module.name === this.$.currentModuleName) {
                    // module already shown
                    if (callback) {
                        callback();
                    }
                } else {
                    if (this.$moduleCache.hasOwnProperty(module.name)) {
                        this._startModule(module.name, this.$moduleCache[module.name], callback, routeContext, true);
                    } else {

                        var self = this;
                        // load module

                        require([this.$stage.$applicationContext.getFqClassName(module.moduleClass)], function (moduleBaseClass) {
                            var moduleInstance = new moduleBaseClass(null, false, self.$stage, null, null);

                            if (moduleInstance instanceof Module) {
                                moduleInstance._initialize("auto");

                                // cache instance
                                self.$moduleCache[module.name] = moduleInstance;

                                self._startModule(module.name, moduleInstance, callback, routeContext, false);

                            } else {
                                if (callback) {
                                    callback("Module '" + module.moduleClass + "' isn't an instance of js.core.Module");
                                }
                            }

                        }, function(err) {
                            if (callback) {
                                callback(err);
                            }
                        });
                    }
                }

            },

            // TODO: remove this method and make the modules bindable

            /***
             * @deprecated will be removed soon
             * @return {Array}
             */
            moduleNames: function(){
                var modules = [], conf;
                for(var i = 0; i < this.$configurations.length; i++){
                    conf = this.$configurations[i];
                    if(conf instanceof ModuleConfiguration){
                        modules.push(conf.$.name);
                    }
                }
                return modules;
            },
            render: function () {
                // render the ContentPlaceHolder
                return this.callBase();
            }
        });

        ModuleLoader.findContentPlaceHolders = function (component) {
            var ret = [];

            for (var i = 0; i < component.$children.length; i++) {
                var child = component.$children[i];
                if (child instanceof ContentPlaceHolder) {
                    ret.push(child);
                } else {
                    ret.concat(ModuleLoader.findContentPlaceHolders(child));
                }
            }

            return ret;

        };

        return ModuleLoader;
    });