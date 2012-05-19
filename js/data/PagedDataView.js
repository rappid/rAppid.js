define(["js/core/Component", "js/core/List", "js/data/Collection", "flow", "underscore"], function (Component, List, Collection, flow, _) {

    return Component.inherit("js.data.PagedDataView", {


        ctor: function() {
            this.callBase();
            this.$execId = 0;
        },

        defaults: {
            page: null,
            pageCount: null,
            baseList: null,
            pageSize: 20
        },

        initialize: function() {
            this.set('list', new List());
            var self = this;
            this.bind('baseList','add', function(){
                self.hasNextPage.trigger();
            });
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

                var baseList = this.$previousAttributes.baseList;
                this._unbindList(baseList);

                baseList = attributes.baseList;

                if (baseList && (!(baseList instanceof List ) || !(baseList instanceof Collection))) {
                    throw "baseList must be a List or a Collection";
                }

                // bind to new list
                this._bindList(baseList);

                // remove all items from list
                this.$.list.clear();

                var pageIndex = attributes.page || this.$.page;
                if (pageIndex) {
                    // and show the current page
                    this.showPage(pageIndex, null, true);
                }

            }

            if (attributes.hasOwnProperty("page") && attributes.page) {
                this.showPage(attributes.page, null, attributes.page !== this.$previousAttributes.page);
            }

        },

        /***
         * navigates to page
         * @param {Number} pageIndex
         * @param {Function} [callback] callback if navigation completes
         */
        showPage: function (pageIndex, callback, noPageCheck) {
            if(this.hasPage(pageIndex)){
                var i;
                pageIndex = pageIndex || 0;

                if (!this.$.baseList || (!noPageCheck && pageIndex === this.$.page)) {
                    // nothing to do
                    if (callback) {
                        callback();
                    }
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
                    var collectionPageSize = this.$.baseList.$options.pageSize;

                    var collectionStartPage = this._itemIndexToPageIndex(this._pageIndexToItemIndex(pageIndex), collectionPageSize);
                    var collectionEndPage = this._itemIndexToPageIndex(this._pageIndexToItemIndex(pageIndex + 1) - 1, collectionPageSize);

                    var pageIndices = {};
                    for (i = collectionStartPage; i <= collectionEndPage; i++) {
                        pageIndices[i] = i;
                    }

                    var self = this;

                    flow()
                        .seq("execId", function () {
                            return ++self.$execId
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

                                var viewStartIndex = self._pageIndexToItemIndex(pageIndex, self.$.pageSize);
                                if (viewStartIndex < items.length) {
                                    // viewStartIndex -= collectionStartPage * collectionPageSize;


                                    // remove overlapping at start and end
                                    items = items.slice(viewStartIndex, viewStartIndex + self.$.pageSize);

                                    // and reset list
                                    self.$.list.reset(items);
                                }


                            }

                            if (callback) {
                                callback(err);
                            }
                        });

                } else {
                    if (callback) {
                        callback()
                    }
                }

                this.set('page', pageIndex);
            } else {
                if (callback) {
                    callback()
                }
            }

        },

        hasPreviousPage: function(){
            return this.$.page > 0;
        }.onChange('page'),
        hasPage: function(pageIndex){
            if(this.$.baseList){
                return this.$.baseList.$itemsCount === null || this.$.baseList.$itemsCount > (pageIndex) * this.$.pageSize;
            }
            return true;
        },
        hasNextPage: function(){
            return this.hasPage(this.$.page + 1);
        }.onChange('page','pageSize', 'baseList'),
        previousPageIndex: function () {
            return Math.max((this.$.page || 0) - 1, 0);
        }.onChange('page'),

        nextPageIndex: function () {
            // TODO top range
            return (this.$.page || 0) + 1;
        }.onChange('page'),

        currentPageIndex: function() {
            return (this.$.page || 0)
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

        _unbindList: function (list) {
            if (list && list instanceof List) {
                list.unbind('add', this._onItemAdded);
                list.unbind('remove', this._onItemRemoved);
                list.unbind('change', this._onItemChange);
                list.unbind('reset', this._onReset);
                list.unbind('sort', this._onSort);
            }
        },

        _bindList: function (list) {
            if (list && list instanceof List) {
                list.bind('add', this._onItemAdded, this);
                list.bind('remove', this._onItemRemoved, this);
                list.bind('change', this._onItemChanged, this);
                list.bind('reset', this._onReset, this);
                list.bind('sort', this._onSort);
            }
        }

        // TODO: item added, removed, sort events handling
    });
});