define(["js/data/DataView", "js/core/List", "js/data/Collection", "flow", "underscore"], function (DataView, List, Collection, flow, _) {

    return DataView.inherit("js.data.PagedDataView", {


        ctor: function () {
            this.callBase();
            this.$execId = 0;
        },

        defaults: {
            page: 0,
            pageCount: null,
            baseList: null,
            pageSize: 20
        },

        initialize: function () {
            this.set('list', new List());
            this.bind('baseList', 'add', this.hasNextPage.trigger);
            this.callBase();

        },

        _commitChangedAttributes: function (attributes) {

            this.callBase(attributes);

            if (!attributes) {
                return;
            }

            if (attributes.hasOwnProperty("list") && this.$initialized) {
                throw "list cannot be set. It is readonly.";
            }

            if (attributes.hasOwnProperty("baseList")) {
                // unbind old list

                var baseList = attributes.baseList;

                if (baseList && !((baseList instanceof List ) || (baseList instanceof Collection))) {
                    throw "baseList must be a List or a Collection";
                }

                // remove all items from list
                this.$.list.clear();

                var pageIndex = attributes.page || this.$.page;
                if (pageIndex != null) {
                    // and show the current page
                    this.showPage(pageIndex, null, true);
                }

            } else if (attributes.hasOwnProperty("page") && !this.$loadingPage) {
                this.showPage(attributes.page, null, attributes.page !== this.$previousAttributes.page);
            }


        },
        /***
         * navigates to page
         * @param {Number} pageIndex
         * @param {Function} [callback] callback if navigation completes
         */
        showPage: function (pageIndex, callback, noPageCheck) {

            if (this.$loadingPage) {
                if (callback) {
                    callback();
                }
                return;
            }
            var self = this;

            function cb(err) {
                if (callback) {
                    callback(err);
                }
                self.$loadingPage = false;
            }

            if (this.hasPage(pageIndex)) {
                this.$loadingPage = true;

                var i;
                pageIndex = pageIndex || 0;
                noPageCheck = _.isUndefined(noPageCheck) ? true : noPageCheck;

                if (!this.$.baseList || (!noPageCheck && pageIndex === this.$.page)) {
                    // nothing to do
                    cb();
                    return;
                }

                var list = this.$.list;
                var baseList = this.$.baseList;

                list.clear();

                // add items
                var startIndex = this.$.pageSize * pageIndex;
                if (baseList.$items.length > startIndex) {
                    for (i = 0; i < this.$.pageSize; i++) {
                        list.add(baseList.at(startIndex + i));
                    }
                }


                if (baseList instanceof Collection) {
                    // determinate pages to load based on the page size
                    var collectionPageSize = this.$.baseList.$.pageSize;

                    var collectionStartPage = this._itemIndexToPageIndex(this._pageIndexToItemIndex(pageIndex), collectionPageSize);
                    var collectionEndPage = this._itemIndexToPageIndex(this._pageIndexToItemIndex(pageIndex + 1) - 1, collectionPageSize);

                    var pageIndices = {};
                    for (i = collectionStartPage; i <= collectionEndPage; i++) {
                        pageIndices[i] = i;
                    }


                    flow()
                        .seq("execId", function () {
                            return ++self.$execId;
                        })
                        .parEach(pageIndices, function (pageIndex, cb) {
                            baseList.fetchPage(pageIndex, null, cb);
                        })
                        .exec(function (err, results) {

                            if (!err && results.execId == self.$execId) {
                                var items = [];
                                for (i = collectionStartPage; i <= collectionEndPage; i++) {
                                    items = items.concat(results[i].$items);
                                }

                                self._calculatePageCount();


                                var viewStartIndex = self._pageIndexToItemIndex(pageIndex, self.$.pageSize);
                                viewStartIndex -= collectionStartPage * collectionPageSize;
                                if (viewStartIndex < items.length) {
                                    // remove overlapping at start and end
                                    items = items.slice(viewStartIndex, viewStartIndex + self.$.pageSize);

                                    // and reset list
                                    self.$.list.reset(items);
                                }
                            }
                            self.set('page', pageIndex);
                            cb(err);
                        });

                } else {
                    self._calculatePageCount();
                    self.set('page', pageIndex);
                    cb();
                }
            } else {
                this._calculatePageCount();
                cb();
            }

        },

        _calculatePageCount: function () {
            var pageCount = 0;
            if (this.$.baseList) {
                pageCount = Math.floor(this.$.baseList.size() / this.$.pageSize);
            }

            this.set('pageCount', pageCount);

        },

        hasPreviousPage: function () {
            return this.$.page > 0;
        }.onChange('page'),

        hasPage: function (pageIndex) {
            if (this.$.baseList) {
                if (this.$.baseList instanceof Collection) {
                    return _.isUndefined(this.$.baseList.$.$itemsCount) || this.$.baseList.$.$itemsCount > (pageIndex) * this.$.pageSize;
                } else {
                    return this.$.baseList.size() > (pageIndex) * this.$.pageSize;
                }
            }
            return false;
        },
        hasNextPage: function () {
            return this.hasPage(this.$.page + 1);
        }.onChange('page', 'pageSize', 'baseList'),
        previousPageIndex: function () {
            return Math.max((this.$.page || 0) - 1, 0);
        }.onChange('page'),

        nextPageIndex: function () {
            // TODO top range
            return (this.$.page || 0) + 1;
        }.onChange('page'),

        currentPageIndex: function () {
            return (this.$.page || 0);
        }.onChange('page'),

        previousPage: function (callback) {
            this.showPage(this.previousPageIndex(), callback);
        },

        nextPage: function (callback) {
            this.showPage(this.nextPageIndex(), callback);
        },

        _pageIndexToItemIndex: function (pageIndex, pageSize) {
            pageSize = pageSize || this.$.pageSize;
            return pageIndex * pageSize;
        },

        _itemIndexToPageIndex: function (itemIndex, pageSize) {
            pageSize = pageSize || this.$.pageSize;
            return Math.floor(itemIndex / pageSize);
        },
        destroy: function () {
            this.unbind('baseList', 'add', this.hasNextPage.trigger);
            this.callBase();
        }

        // TODO: item added, removed, sort events handling
    });
});