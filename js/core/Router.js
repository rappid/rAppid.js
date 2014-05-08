define(["js/core/Component", "underscore", "js/conf/RouteConfiguration"],

    function (Component, _, RouteConfiguration) {

        return Component.inherit("js.core.Router", {
            ctor: function () {

                this.$routes = [];

                this.callBase();
            },

            defaults: {
                module: null
            },

            initialize: function () {
                this.callBase();

                if (this.$.history) {
                    this.history = this.$.history;
                } else {
                    this.history = this.$stage.$history;
                }

                this.history.addRouter(this);
            },

            _initializeChildren: function (childComponents) {
                this.callBase();
            },

            _childrenInitialized: function () {
                this.callBase();

                for (var c = 0; c < this.$configurations.length; c++) {
                    var config = this.$configurations[c];

                    if (config instanceof RouteConfiguration) {
                        this.addRoute(config.$);
                    }
                }
            },


            /**
             *
             * @param {Regexp|Object} route
             * @param {Function} [fn]
             */
            addRoute: function () {

                var route;
                if (arguments.length == 2) {
                    route = {
                        route: arguments[0],
                        fn: arguments[1]
                    };
                } else {
                    route = arguments[0];
                }

                if (route.onexec) {
                    route.fn = this.$rootScope[route.onexec];
                }

                _.defaults(route, {
                    name: null,
                    route: null,
                    fn: null
                });

                if (route.route && !(route.route instanceof RegExp)) {
                    // build regex from string
                    route.route = new RegExp(route.route);
                }

                if (!(route.fn && route.route)) {
                    throw "fn and route required";
                }

                this.$routes.push(route);
            },

            generateRoutingStack: function(fragment) {

                var delegates = [],
                    rootScope = this.$rootScope,
                    self = this,
                    base = this.get("module.base") || "";

                if (base) {
                    fragment = fragment.substr(base.length);
                }

                function addDelegate(route, params) {

                    delegates.push(function(cb) {

                        var fragment = params.shift();
                        var routeContext = {
                            callback: cb,
                            router: self,
                            params: _.clone(params),
                            fragment: fragment,
                            route: route,
                            // breaks the routeStack execution
                            end: function() {
                                cb.end();
                            },
                            navigate: function(fragment, createHistoryEntry, triggerRoute)  {
                                if (_.isUndefined(createHistoryEntry)) {
                                    createHistoryEntry = false;
                                }

                                self.navigate(fragment, createHistoryEntry, triggerRoute, cb);
                            }
                        };

                        params.unshift(routeContext);

                        if (route.fn._async) {
                            try {
                                route.fn.apply(rootScope, params);
                            } catch (e) {
                                cb(e);
                            }
                        } else {
                            // exec route sync, call callback after execution
                            try {
                                cb(null, route.fn.apply(rootScope, params));
                            } catch (e) {
                                cb(e);
                            }
                        }
                    });
                }

                for (var i = 0; i < this.$routes.length; i++) {
                    // get the route
                    var route = this.$routes[i];
                    // and test against regexp
                    var params = route.route.exec(fragment);

                    if (params) {
                        // route matches
                        addDelegate(route, params);
                    }
                }

                return delegates;
            },

            executeRoute: function (fragment, callback) {

                var cb = function (err, data) {
                    if (callback) {
                        callback(err, data);
                    }
                };

                // Test routes and call callback
                for (var i = 0; i < this.$routes.length; i++) {
                    var route = this.$routes[i];
                    var params = route.route.exec(fragment);
                    if (params) {

                        params.shift();

                        var routeContext = {
                            callback: cb,
                            router: this,
                            params: _.clone(params),
                            fragment: fragment,
                            route: route
                        };

                        params.unshift(routeContext);

                        var thisArg = this.$rootScope;

                        if (route.fn._async) {
                            route.fn.apply(thisArg, params);
                        } else {
                            // exec route sync, call callback after execution
                            try {
                                cb(null, route.fn.apply(thisArg, params));
                            } catch (e) {
                                cb(e);
                            }
                        }

                        return true;
                    }
                }

                return false;
            },

            /**
             * shortcut to history.navigate
             * @param to
             * @param createHistoryEntry
             * @param triggerRoute
             */
            navigate: function (to, createHistoryEntry, triggerRoute, force, callback) {
                return this.history.navigate(to, createHistoryEntry, triggerRoute, force, callback);
            }
        });
    });