define(["js/core/List", "js/data/Collection", "flow"], function (List, Collection, flow) {

    return List.inherit("js.data.PagedView", {

        defaults: {
            page: null,
            pageCount: null,
            list: null,
            pageSize: 20
        },

        ctor: function (baseList, attributes) {
            this.callBase([], attributes);

            this.set("list", baseList);
        },

        _commitChangedAttributes: function (attributes) {

            this.callBase(attributes);

            if (!attributes) {
                return;
            }

            if (attributes.hasOwnProperty("list")) {
                // unbind old list

                var list = this.$previousAttributes.list;
                this._unbindList(list);

                list = attributes.list;

                if (list && !(list instanceof List || list instanceof Collection)) {
                    throw "list must be a List or a Collection";
                }

                // bind to new list
                this._bindList(list);
            }

            if (attributes.hasOwnProperty("page")) {
                this.showPage(attributes.page, null, attributes.page !== this.$previousAttributes.page);
            }

        },

        /***
         * navigates to page
         * @param {Number} pageIndex
         * @param {Function} [callback] callback if navigation completes
         */
        showPage: function(pageIndex, callback, noPageCheck) {

            if (!this.$.list || (!noPageCheck && pageIndex === this.$.page)) {
                // nothing to do
                if (callback) {
                    callback();
                }
                return;
            }

            var list = this.$.list;

            if (list instanceof Collection) {
                // determinate pages to load based on the page size
                var collectionPageSize = this.$.list.$options.pageSize;

                var collectionStartPage = this._itemIndexToPageIndex(this._pageIndexToItemIndex(pageIndex), collectionPageSize);
                var collectionEndPage = this._itemIndexToPageIndex(this._pageIndexToItemIndex(pageIndex + 1) - 1, collectionPageSize);

                var pageIndices = [];
                for (var i = collectionStartPage; i <= collectionEndPage; i++) {
                    pageIndices.push(i);
                }

                flow()
                    .parEach(pageIndices, function(pageIndex, cb) {
                        list.fetchPage(pageIndex, null, cb);
                    })
                    .exec(callback);

            }
        },

        _pageIndexToItemIndex: function(pageIndex, pageSize) {
            pageSize = pageSize || this.$.pageSize;
            return pageIndex * pageSize;
        },

        _itemIndexToPageIndex: function(itemIndex, pageSize) {
            pageSize = pageSize || this.$.pageSize;
            return Math.floor(itemIndex / pageSize);
        },

        _unbindList: function(list) {
            if (list) {
                list.unbind('add', this._onItemAdded);
                list.unbind('remove', this._onItemRemoved);
                list.unbind('change', this._onItemChange);
                list.unbind('reset', this._onReset);
                list.unbind('sort', this._onSort);
            }
        },

        _bindList: function(list) {
            if (list) {
                list.bind('add', this._onItemAdded, this);
                list.bind('remove', this._onItemRemoved, this);
                list.bind('change', this._onItemChanged, this);
                list.bind('reset', this._onReset, this);
                list.bind('sort', this._onSort);
            }
        }
    });
});