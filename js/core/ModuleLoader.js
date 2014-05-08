define(["require", "js/html/HtmlElement", "js/ui/ContentPlaceHolder", "js/core/Module", "underscore", "js/conf/ModuleConfiguration", "flow"],
    function (require, HtmlElement, ContentPlaceHolder, Module, _, ModuleConfiguration, flow) {

        var undefined;

        return HtmlElement.inherit("js.core.ModuleLoader", {

            defaults: {
                /**
                 * The current module name
                 */
                currentModuleName: null,
                /**
                 * The current module
                 */
                currentModule: null,

                tagName: 'div',
                /**
                 * The css class of the component
                 */
                componentClass: "module-loader module-{currentModuleName}",
                /**
                 * The current state - is set to "loading" or "loading unloading"
                 * Is rendered to css className
                 */
                state: null,
                /***
                 * the router used for automatically registering routes from {@link js.conf.ModuleConfiguration}
                 *
                 * @type js.core.Router
                 * @required
                 */
                router: null
            },

            $classAttributes: ['router' , 'currentModule', 'currentModuleName', 'state'],

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
             * @param {js.conf.ModuleConfiguration} module
             */
            addModule: function (module) {
                _.defaults(module, {
                    name: null,
                    moduleClass: null,
                    route: null,
                    attributes: null,
                    relative: false
                });

                if (!module.name) {
                    throw "module cannot be added: module name is required";
                }

                if (!module.moduleClass) {
                    throw "no moduleClass defined for module";
                }

                if (this.$modules.hasOwnProperty(module.name)) {
                    throw "module with name '" + module.name + "' already registered";
                }

                this.$modules[module.name] = module;

                if (module.route) {
                    if (!this.$.router) {
                        throw "defining modules with routes requires a router instance to be set";
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
            /**
             * Starts the module with the given name
             * @param {String} moduleName - The name of the module
             * @param {js.core.Module} moduleInstance - the module instance
             * @param {Function} callback - the callback function
             * @param {Object} routeContext - the route context
             * @param {Object} [cachedInstance]
             * @private
             */
            _startModule: function (moduleName, moduleInstance, callback, routeContext, cachedInstance) {

                var self = this;

                //noinspection JSValidateTypes
                flow()
                    .seq(function (cb) {

                        self.$moduleInstance = moduleInstance;

                        var currentModule = self.$.currentModule;
                        if (currentModule) {
                            currentModule._unload(cb);
                        } else {
                            cb();
                        }
                    })
                    .seq(function (cb) {

                        // start module
                        moduleInstance.start(function (err) {

                            if (err || cachedInstance) {
                                cb(err);
                            } else {
                                if (routeContext) {
                                    // fresh instance with maybe new routers -> exec routes for new router
                                    var routeExecutionStack = [];

                                    for (var i = 0; i < moduleInstance.$routers.length; i++) {
                                        var router = moduleInstance.$routers[i];

                                        router.set("module", moduleInstance);

                                        routeExecutionStack = routeExecutionStack.concat(router.generateRoutingStack(routeContext.fragment));
                                    }

                                    flow()
                                        .seqEach(routeExecutionStack, function (routingFunction, cb) {
                                            routingFunction(cb);
                                        })
                                        .exec(cb);

                                } else {
                                    cb();
                                }

                            }
                        }, routeContext);
                    })
                    .seq(function () {
                        if (moduleInstance === self.$moduleInstance) {
                            self._clearContentPlaceHolders();

                            self.set('currentModuleName', moduleName);
                            var contentPlaceHolders = self.getContentPlaceHolders("external");

                            // set content
                            for (var i = 0; i < contentPlaceHolders.length; i++) {
                                var contentPlaceHolder = contentPlaceHolders[i];
                                contentPlaceHolder.set("content", moduleInstance.findContent(contentPlaceHolder.$.name));
                            }
                        }

                    })
                    .exec(function (err) {
                        var moduleInstance = self.$moduleInstance;

                        self.set({
                            state: err ? 'error' : null,
                            currentModule: moduleInstance
                        });

                        self.$moduleInstance = null;

                        if (callback) {
                            callback(err, moduleInstance);
                        }
                    });


            },

            /***
             * loads an module instance into the module loader and starts the module
             *
             * @param {js.conf.ModuleConfiguration} module - the module to load
             * @param {Function} [callback] - a callback function which gets invoked after the module is loaded or an error occurred
             * @param {js.core.Router.RouteContext} [routeContext]
             */
            loadModule: function (module, callback, routeContext) {

                var self = this;
                callback = callback || function () {
                };

                if (!module.hasOwnProperty("name")) {
                    // load by name
                    module = this.$modules[module];
                }

                if (!module) {
                    callback("module not found");
                }

                if (module.name === this.$.currentModuleName) {
                    // module already shown
                    if (callback) {
                        callback();
                    }
                } else {

                    //noinspection JSValidateTypes
                    flow()
                        .seq(function () {
                            self.set('currentModuleName', null);
                            self.set('state', 'unloading loading');
                        })
                        .seq(function (cb) {

                            self.set('state', 'loading');

                            self._clearContentPlaceHolders();
                            self.$lastModuleName = self.$.currentModuleName;

                            var relativeFragment;

                            var relative = module.relative,
                                moduleBase = "";

                            if (relative) {
                                relativeFragment = routeContext.params[0];

                                if (relativeFragment !== undefined) {
                                    moduleBase = routeContext.fragment.substr(0, routeContext.fragment.length - relativeFragment.length);
                                }
                            }

                            if (self.$moduleCache.hasOwnProperty(module.name)) {
                                var moduleInstance = self.$moduleCache[module.name];
                                moduleInstance.set("base", moduleBase);

                                self._startModule(module.name, moduleInstance, cb, routeContext, !relative);
                            } else {

                                // load module

                                require([self.$stage.$applicationContext.getFqClassName(module.moduleClass)], function (moduleBaseClass) {
                                    var moduleInstance = new moduleBaseClass(module.attributes, false, self.$stage, null, null);

                                    if (moduleInstance instanceof Module) {
                                        if (typeof(CollectGarbage) == "function") {
                                            CollectGarbage();
                                        }

                                        moduleInstance._initialize("auto");

                                        // cache instance
                                        self.$moduleCache[module.name] = moduleInstance;
                                        moduleInstance.set("base", moduleBase);

                                        self._startModule(module.name, moduleInstance, cb, routeContext, false);

                                    } else {
                                        cb(new Error("Module '" + module.moduleClass + "' isn't an instance of js.core.Module"));
                                    }

                                }, function (err) {
                                    cb(err);
                                });
                            }

                        })
                        .exec(function (err) {

                            if (err) {
                                self.set('state', 'error');
                                self.log(err, "warn");
                            }

                            callback(err);
                        });

                }

            },
            /**
             * Returns true if module with name is active
             *
             * @param {String} moduleName
             */
            isModuleActive: function (moduleName) {
                return this.$.currentModuleName == moduleName;
            }.onChange('currentModuleName'),

            _clearContentPlaceHolders: function () {

                var contentPlaceHolders = this.getContentPlaceHolders("external");

                // set content
                for (var i = 0; i < contentPlaceHolders.length; i++) {
                    var contentPlaceHolder = contentPlaceHolders[i];
                    contentPlaceHolder.set("content", null);
                }

            },

            // TODO: remove this method and make the modules bindable

            /***
             * @deprecated will be removed soon
             * @return {Array}
             */
            moduleNames: function () {
                var modules = [], conf;
                for (var i = 0; i < this.$configurations.length; i++) {
                    conf = this.$configurations[i];
                    if (conf instanceof ModuleConfiguration) {
                        modules.push(conf.$.name);
                    }
                }
                return modules;
            },

            _renderState: function (state, oldState) {
                oldState && this.removeClass(oldState);
                state && this.addClass(state);
            }
        });
    });