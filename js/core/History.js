define(["js/core/Bindable", "flow"], function (Bindable, flow) {


    var routeStripper = /^#?!?\/?/,
        undefined,
        emptyCallback = function () {
        };

    var History = Bindable.inherit("js.core.History", {

        ctor: function () {
            this.callBase();
            this.$routers = [];
            this.$processUrl = true;

            this.$history = [];
        },

        defaults: {
            interval: 50
        },

        // TODO: make this bindable so that i can call this.fragment.triggerChange()

        /***
         * @Bindable
         * @return {String}
         */
        fragment: function() {
            return this.$fragment;
        }.on('change:fragment'),

        /***
         * determinate the current fragment
         * @return {String} the current fragment without the starting #/
         * @private
         */
        _getFragment: function () {
            var fragment;

            if (this.runsInBrowser()) {
                fragment = decodeURI(window.location.hash);
            } else {
                fragment = this.$history[this.$history.length - 1] || "";
            }

            return fragment.replace(routeStripper, '');
        },
        /***
         * This method is called to start the history
         * @param {Function} callback - get's called after the navigation is completed
         * @param {String} initialHash
         */
        start: function (callback, initialHash) {

            var self = this;
            this.$checkUrlFn = function () {
                self.checkUrl.apply(self, arguments);
            };


            if (this.runsInBrowser()) {
                // we're on a browser
                if ("onhashchange" in window) {
                    if (window.addEventListener) {
                        window.addEventListener('hashchange',
                            this.$checkUrlFn, false);
                    } else {
                        window.attachEvent('onhashchange', this.$checkUrlFn);
                    }
                } else {
                    // polling
                    this.$checkUrlInterval = setInterval(this.$checkUrlFn, this.$.interval);
                }
            } else {
                // rendering on node
                this.$history.push(initialHash || "");
            }

            this.navigate(this._getFragment(), true, true, callback);
            this.$processUrl = true;
        },

        stop: function () {
            if (typeof window !== "undefined") {
                if ("onhashchange" in window) {
                    if (window.removeEventListener) {
                        window.removeEventListener('hashchange',
                            this.$checkUrlFn, false);
                    } else {
                        window.detachEvent('onhashchange', this.$checkUrlFn);
                    }
                } else {
                    // polling
                    clearInterval(this.$checkUrlInterval);
                }
            }
        },

        addRouter: function (router) {
            this.$routers.push(router);
        },

        checkUrl: function (e) {

            if (this.$processUrl) {
                var currentFragment = this._getFragment();
                if (currentFragment == this.$fragment) {
                    return false;
                }

                this.navigate(currentFragment, true, true, emptyCallback);
            }

            this.$processUrl = true;

        },

        triggerRoute: function (fragment, callback) {

            var routeExecutionStack = [];

            for (var i = 0; i < this.$routers.length; i++) {
                routeExecutionStack = routeExecutionStack.concat(this.$routers[i].generateRoutingStack(fragment));
            }

            if (routeExecutionStack.length === 0) {
                console.log("no route for '" + fragment + "' found.");
                // no route found but
                if (callback) {
                    // execute callback
                    callback();
                }
            } else {
                flow()
                    .seqEach(routeExecutionStack, function(routingFunction, cb){
                        routingFunction(cb);
                    })
                    .exec(callback)
            }
        },
        /***
         * Navigates to a fragment
         * @param {String} fragment
         * @param {Boolean} [createHistoryEntry] - default true
         * @param {Boolean} [triggerRoute] - default true
         * @param {Function} callback - navigate callback
         */
        navigate: function (fragment, createHistoryEntry, triggerRoute, callback) {

            var self = this;

            if (!callback && createHistoryEntry instanceof Function) {
                callback = createHistoryEntry;
                createHistoryEntry = null;
            }

            if (!callback && triggerRoute instanceof Function) {
                callback = triggerRoute;
                triggerRoute = null;
            }

            if (createHistoryEntry == undefined || createHistoryEntry == null) {
                createHistoryEntry = true;
            }

            if (triggerRoute == undefined || triggerRoute == null) {
                triggerRoute = true;
            }

            var eventData = {
                fragment: fragment,
                createHistoryEntry: createHistoryEntry,
                triggerRoute: triggerRoute
            };

            this.trigger(History.EVENTS.NAVIGATION_START, eventData);
            this.$processUrl = (this._getFragment() === "#/" + fragment);

            if (createHistoryEntry) {
                if (this.runsInBrowser()) {
                    window.location.hash = "/" + encodeURI(fragment);
                } else {
                    this.checkUrl(null);
                }
                this.$history.push(fragment);
            } else {
                if (this.runsInBrowser()) {
                    // replace hash
                    window.location.replace("#/" + fragment);

                }
                this.$history[this.$history.length - 1] = fragment;
            }

            if(this.$fragment !== fragment){
                this.$fragment = fragment;
                this.trigger('change:fragment', this.$fragment);
            }


            if (triggerRoute) {
                this.triggerRoute(fragment, function() {
                    self.trigger(History.EVENTS.NAVIGATION_COMPLETE, eventData);
                    if (callback) {
                        callback.apply(arguments);
                    }
                });
            } else {
                this.trigger(History.EVENTS.NAVIGATION_COMPLETE, eventData);
            }
        }
    });

    History.EVENTS = {
        NAVIGATION_START: "navigationStart",
        NAVIGATION_COMPLETE: "navigationComplete"
    };

    return History;
});