var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.core.Router", ["js.core.Component"],

        function (Component) {

            return Component.inherit({
                ctor: function () {

                    this.$routes = [];

                    this.callBase();
                },

                initialize: function () {
                    this.callBase();

                    if (this.$.history) {
                        this.history = this.$.history;
                    } else {
                        this.history = rAppid.systemManager.application.history;
                    }

                    this.history.addRouter(this);
                },

                _childrenInitialized: function () {
                    this.callBase();

                    for (var c = 0; c < this.$configurations.length; c++) {
                        var config = this.$configurations[c];

                        if (config.className == "js.conf.Route") {
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
                            regex: arguments[0],
                            fn: arguments[1]
                        }
                    } else {
                        route = arguments[0];
                    }

                    if (route.onexec) {
                        route.fn = this.$rootScope[route.onexec];
                    }

                    rAppid._.defaults(route, {
                        name: null,
                        regex: null,
                        fn: null
                    });

                    if (route.regex && !(route.regex instanceof RegExp)) {
                        // build regex from string
                        route.regex = new RegExp(route.regex);
                    }

                    if (!(route.fn && route.regex)) {
                        throw "fn and regex required"
                    }

                    this.$routes.push(route);
                },

                executeRoute: function (fragment) {
                    // Test routes and call callback
                    for (var i = 0; i < this.$routes.length; i++) {
                        var route = this.$routes[i];
                        var params = route.regex.exec(fragment);
                        if (params) {
                            params.shift();
                            route.fn.apply(this.$rootScope, params);

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
                navigate: function (to, createHistoryEntry, triggerRoute) {
                    return this.history.navigate(to, createHistoryEntry, triggerRoute);
                }
            });
        });
});