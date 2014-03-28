define(['require', "js/core/List", "js/data/Model", "flow", "underscore", "js/data/Query"], function (require, List, Model, flow, _, Query) {

    var State = {
        CREATED: 0,
        LOADING: 1,
        LOADED: 2,
        ERROR: -1
    };

    var COUNTSTATE = {
        UNKNOWN: 0,
        COUNTING: 1,
        COUNTED: -1
    };

    var Collection = List.inherit("js.data.Collection", {

        /**
         * The model factory for creating items
         */
        $modelFactory: Model,

        isCollection: true, // read only to determinate if its a collection and prevent circular dependencies

        ctor: function (items, options) {
            options = options || {};

            _.defaults(options, {
                root: null,
                query: null,
                pageSize: null,
                queryParameters: {},
                sortParameters: null,
                factory: this.$modelFactory || require('js/data/Model'),
                type: null
            });


            this.$filterCache = {};
            this.$sortCache = {};
            this._count = {
                callbacks: [],
                state: COUNTSTATE.UNKNOWN
            };

            if (options.root) {
                _.defaults(options, options.root.options);
                this.$modelFactory = options.root.$modelFactory;
            }

            this.callBase(items, options);

            this.$pageCache = [];
        },

        /***
         *
         * @param {js.data.Query} query
         * @return {*}
         */
        filter: function (query) {
            var rootCollection = this.getRoot();

            if (query instanceof Query) {

                var options = _.defaults({}, {
                    query: query,
                    root: rootCollection
                }, rootCollection.$);

                var filterCacheId = query.whereCacheId(),
                    cache = rootCollection.$filterCache;

                if (filterCacheId) {
                    if (!cache[filterCacheId]) {
                        cache[filterCacheId] = this._createFilteredCollection(query, options);
                    }

                    return cache[filterCacheId];
                }

            }

            return rootCollection;
        },
        /**
         * This method creates internally a filtered collection
         * @param {js.data.Query} query
         * @param {Object} options
         * @returns {js.data.Collection}
         * @private
         */
        _createFilteredCollection: function (query, options) {
            options.$itemsCount = undefined;

            var collection = new this.factory(null, options);
            collection.$context = this.$context;

            return collection;
        },
        /**
         * This method creates internally a sorted collection
         * @param {js.data.Query} query
         * @param {Object} options
         * @returns {this.factory}
         * @private
         */
        _createSortedCollection: function (query, options) {
            // TODO: if fully loaded -> return this.callBase();
            var collection = new this.factory(null, options);
            collection.$context = this.$context;

            return collection;
        },
        /**
         * Returns a sorted query collection
         *
         * @param {js.data.Query} query
         * @returns {js.data.Collection}
         */
        sort: function (query) {
            if (query instanceof Query && query.query.sort) {
                if (this.$.query) {
                    query.query.where = this.$.query.query.where;
                }


                var options = _.defaults({}, {
                    query: query,
                    root: this.getRoot()
                }, this.$);

                var sortCacheId = query.sortCacheId();

                if (!this.$sortCache[sortCacheId]) {
                    this.$sortCache[sortCacheId] = this._createSortedCollection(query, options);
                }

                return this.$sortCache[sortCacheId];
            }

            return this;
        },
        /**
         * Returns a query collection
         *
         * @param {js.data.Query} query
         * @returns {js.data.Collection}
         */
        query: function (query) {
            return this.filter(query).sort(query);
        },

        /**
         * Returns the original root collection of a query or sorted or filtered collection.
         *
         * @return {js.data.Collection}
         */
        getRoot: function () {
            return this.$.root || this;
        },

        /**
         *
         * With no options it fetches all pages of the collection. So be careful.
         *
         * If you want to fetch a specific page, provide limit and/or offset in the options object.
         * The callback will then return the err object and a page with the size of the provided limit and offset
         *
         * @param {Object} [options]
         * @param {Function} callback
         */
        fetch: function (options, callback) {
            if (options instanceof Function) {
                callback = options;
                options = null;
            }
            options = options || {};

            var self = this;

            if (options.limit || options.offset) {

                var page = new Page(null, this, 0);
                page.fetch(options, function (err) {
                    // insert data into items if not already inserted
                    if (!err && !page.itemsInsertedIntoCollection) {
                        page.itemsInsertedIntoCollection = true;
                    }

                    if (callback) {
                        callback(err, page, options);
                    }

                });

            } else {

                function fetchPages(pageCount) {
                    var delegates = [];

                    function addFetchPageDelegate(pageIndex) {
                        delegates.push(function (cb) {
                            self.fetchPage(pageIndex, options, cb);
                        });
                    }

                    for (var i = 0; i < pageCount; i++) {
                        addFetchPageDelegate(i);
                    }

                    // execute loading parallel
                    flow()
                        .par(delegates)
                        .exec(function (err) {
                            if (callback) {
                                callback(err, self);
                            }
                        });
                }

                if (!this.$.pageSize) {
                    // unlimited pageSize -> create one and only page and fetch
                    this.fetchPage(0, options, callback);
                } else {
                    // determinate pages
                    var pageCount = this.pageCount();

                    if (!isNaN(pageCount)) {
                        // we know how many page are there
                        fetchPages(pageCount);
                    } else {
                        // load first page in order to get the available itemCount
                        // to calculate the pageCount
                        this.fetchPage(0, options, function (err) {
                            if (!err) {
                                // we now should calculate a page count
                                pageCount = self.pageCount();

                                if (isNaN(pageCount)) {
                                    if (callback) {
                                        callback("Count for collection couldn't be fetched.", self);
                                    }
                                } else {
                                    fetchPages(pageCount);
                                }
                            } else {
                                if (callback) {
                                    callback(err, self);
                                }
                            }
                        });
                    }
                }
            }


        },
        /**
         * Returns the number of pages
         *
         * @returns {*}
         */
        pageCount: function () {
            if (this.$.hasOwnProperty("$itemsCount")) {
                return Math.ceil(this.$.$itemsCount / this.$.pageSize);
            } else {
                // we actually don't know how many pages there will be
                return NaN;
            }
        },

        getContextForChild: function (childFactory) {
            return this.$context;
        },

        parse: function (data) {
            return data;
        },
        /**
         * Creates an item with the $modelFactory of the collection.
         *
         * In other words. It creates a model for the collection but the model is not added to the collection.
         *
         * @param {String} [id] - the id of the item
         * @param {Function} [modelFactory]
         * @returns {js.data.Entity}
         */
        createItem: function (id, modelFactory) {
            var item = this.getContextForChild(this.$modelFactory).createEntity(modelFactory || this.$modelFactory, id);

            item.$parent = this.$parent;
            item.$collection = this;

            return item;
        },
        /**
         * Fetches a page and returns it in the callback
         *
         * @param {Number} pageIndex - starts at 0
         * @param {Object} options
         * @param {Function} callback
         */
        fetchPage: function (pageIndex, options, callback) {

            if (pageIndex < 0) {
                throw "pageIndex must be >= 0";
            }

            var page = this.$pageCache[pageIndex];
            if (!page) {
                page = this.$pageCache[pageIndex] = new Page(null, this, pageIndex);
            }

            var self = this;
            options = _.extend(this.$, options);
            page.fetch(options, function (err, page) {
                // insert data into items if not already inserted
                if (!err && !page.itemsInsertedIntoCollection) {
                    page.itemsInsertedIntoCollection = true;

                    // add items to collection
                    self.add(page.$items, {
                        index: (pageIndex || 0) * self.$.pageSize
                    });
                }

                if (callback) {
                    callback(err, page, options);
                }
            });
        },
        /**
         * Asynchronous counts the collection. The count is returned in the callback.
         * Note: The dataSource must support the countCollection method
         *
         * @param {Object} options
         * @param {Function} callback
         */
        count: function (options, callback) {
            var self = this;
            this.$context.$dataSource.countCollection(this, options, function (err, count) {
                if (!err) {
                    self.set('$itemsCount', count);
                }
                callback && callback(err, count);
            });
        },
        /**
         * This method invalidates the page cache of the collection.
         * It also clears all page caches of query collections, that have this collection has root collection.
         * After the invalidation the $itemsCount is set to NaN and a reset is done. So all listeners are informed of the change.
         *
         * You should call this method after removing or adding some item to the collection.
         *
         */
        invalidatePageCache: function () {
            this.$pageCache = {};

            for (var key in this.$filterCache) {
                if (this.$filterCache.hasOwnProperty(key)) {
                    this.$filterCache[key].invalidatePageCache();
                }
            }

            for (key in this.$sortCache) {
                if (this.$sortCache.hasOwnProperty(key)) {
                    this.$sortCache[key].invalidatePageCache();
                }
            }

            this.set('$itemsCount', NaN, {silent: true});
            this.reset([]);
        },
        /**
         * Returns the $itemsCount of the collection.
         *
         */
        size: function () {
            return this.$.$itemsCount;
        }.onChange('$itemsCount'),
        /**
         * Returns true if list is empty
         */
        isEmpty: function () {
            var pageCount = this.pageCount();
            if (!isNaN(pageCount)) {
                return pageCount === 0;
            }
            return false;
        }.onChange('$itemsCount'),

        getQueryParameters: function (method) {
            return this.$.queryParameters;
        },
        getSortParameters: function (method) {
            return this.$.sortParameters;
        },
        destroy: function () {
            // TODO: remove destroyed query collections from cache

            this.callBase();
        },

        clone: function () {
            var ret = this.callBase();
            ret.$context = this.$context;
            ret.$parent = this.$parent;
            return ret;
        }
    });

    var Page = Collection.Page = List.inherit({

        ctor: function (items, collection, pageIndex) {
            if (!collection.$.pageSize && pageIndex !== 0) {
                throw "Cannot create page for index '" + pageIndex + "' with pageSize '" + collection.options.pageSize + "'";
            }

            var options = collection.$;

            if (options.pageSize) {
                this.$offset = pageIndex * options.pageSize;
                this.$limit = options.pageSize;
            }

            this.$pageIndex = pageIndex;
            this.$collection = collection;

            this.callBase(items);

            // stores the current fetch state
            this._fetch = {
                callbacks: [],
                state: State.CREATED
            };

        },

        setMetaData: function (metaData) {
            this.$metaData = metaData;

            if (metaData && metaData.hasOwnProperty('count')) {
                // set itemsCount in collection for page calculation
                this.$collection.set('$itemsCount', metaData.count);
            }
        },

        parse: function (data, type) {
            return this.getRoot().parse(data, type);
        },

        getRoot: function () {
            return this.$collection.getRoot();
        },

        getCollection: function () {
            return this.$collection;
        },

        /***
         *
         * @param options
         * @param [Boolean] [options.fetchModels=false] fetch models inside collection
         * @param [Array] [options.fetchSubModels] fetch sub models
         * @param callback
         */
        fetch: function (options, callback) {
            options = options || {};

            if (options.limit || options.offset) {
                this.$offset = options.offset || 0;
                this.$limit = options.limit || this.$limit;
            }

            var self = this;

            function pageFetchedComplete(err, page, originalCallback) {
                var callback = function (err, page) {
                    if (originalCallback) {
                        originalCallback(err, page, options);
                    }
                };


                if (options.fetchModels || options.fetchSubModels) {

                    // TODO: introduce poolSize parameter for par, and parEach

                    flow()
                        .parEach(page.$items, function (model, cb) {
                            model.fetch({
                                fetchSubModels: options.fetchSubModels
                            }, cb);
                        })
                        .exec(function (err) {
                            callback(err, page);
                        });

                } else {
                    callback(err, page);
                }

            }

            if (this._fetch.state === State.LOADING) {
                // currently fetching -> register callback
                this._fetch.callbacks.push(function (err, page) {
                    pageFetchedComplete(err, page, callback);
                });
            } else if (this._fetch.state == State.LOADED) {
                // completed loaded -> execute
                pageFetchedComplete(null, this, callback);
            } else {
                // set state and start loading
                self._fetch.state = State.LOADING;

                this.$collection.$context.$dataSource.loadCollectionPage(this, options, function (err, page) {
                    self._fetch.state = err ? State.ERROR : State.LOADED;

                    // execute callbacks
                    pageFetchedComplete(err, page, callback);

                    _.each(self._fetch.callbacks, function (cb) {
                        cb(err, page);
                    });
                });
            }
        }
    });

    /**
     * Creates a query collection.
     *
     * @param {Function} modelFactory
     * @returns {js.data.Collection}
     */
    Collection.of = function (modelFactory) {

        if (modelFactory instanceof Function) {
            return Collection.inherit(Collection.prototype.constructor.name + '[' + modelFactory.prototype.constructor.name + ']', {
                $modelFactory: modelFactory
            });
        } else {
            throw "Cannot create Collection of '" + modelFactory + "'.";
        }


    };

    return Collection;
});