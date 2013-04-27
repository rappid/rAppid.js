define(["js/core/Bindable", "flow"], function (Bindable, flow) {


    var routeStripper = /^#?!?\/?/,
        undefined,
        emptyCallback = function () {
        };

    /***
     * @summary The History listens to the browsers history and calls the routers when the fragment has changed
     * It also allows to navigate to a given fragment.
     *
     */
    var History = Bindable.inherit("js.core.History", {

        ctor: function () {
            this.callBase();
            this.$routers = [];
            this.$processUrl = true;

            this.$history = [];
        },

        defaults: {
            /**
             * The polling interval for the URL hash if onhashchange is not supported
             * @type Number
             */
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

            this.navigate(this._getFragment(), true, true, true, callback);
            this.$processUrl = true;
        },
        /***
         * Removes all onhaschange listeners or clears polling interval for hash check
         */
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
        /**
         * Adds a router to the history instance
         *
         * @param router
         */
        addRouter: function (router) {
            this.$routers.push(router);
        },
        /**
         * Checks if the current fragment has changed and calls navigate in case it did
         *
         */
        checkUrl: function () {

            if (this.$processUrl) {
                var currentFragment = this._getFragment();
                if (currentFragment == this.$fragment) {
                    return false;
                }

                this.navigate(currentFragment, true, true, true, emptyCallback);
            }

            this.$processUrl = true;

        },
        /**
         * Triggers a route
         *
         * @param {String} fragment - the fragment which should be triggered
         * @param {Function} callback - gets called after the route execution stack is done
         */
        triggerRoute: function (fragment, callback) {

            var routeExecutionStack = [];

            for (var i = 0; i < this.$routers.length; i++) {
                routeExecutionStack = routeExecutionStack.concat(this.$routers[i].generateRoutingStack(fragment));
            }

            if (routeExecutionStack.length === 0) {
                this.log("no route for '" + fragment + "' found.");
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
                    .exec(callback);
            }
        },
        /***
         * Navigates to a fragment
         * @param {String} fragment
         * @param {Boolean} [createHistoryEntry] - default true
         * @param {Boolean} [triggerRoute] - default true
         * @param {Function} callback - navigate callback
         */
        navigate: function (fragment, createHistoryEntry, triggerRoute, force, callback) {

            var self = this;

            if (!callback && createHistoryEntry instanceof Function) {
                callback = createHistoryEntry;
                createHistoryEntry = null;
            }

            if (!callback && triggerRoute instanceof Function) {
                callback = triggerRoute;
                triggerRoute = null;
            }

            if (!callback && force instanceof Function) {
                callback = force;
                force = null;
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

            var urlChange = this._getFragment() !== fragment;

            if (!urlChange && !force) {
                callback && callback();
                return;
            }

            this.trigger(History.EVENTS.NAVIGATION_START, eventData);
            this.$processUrl = urlChange;

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

            this.$processUrl = true;

            if(this.$fragment !== fragment){
                this.$fragment = fragment;
                this.trigger('change:fragment', this.$fragment);
            }


            if (triggerRoute) {
                this.triggerRoute(fragment, function() {
                    self.trigger(History.EVENTS.NAVIGATION_COMPLETE, eventData);
                    if (callback) {
                        callback.apply(self, arguments);
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