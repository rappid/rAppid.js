define(["js/core/List" , "underscore", "js/data/Query", 'js/lib/query/ArrayExecutor', "js/core/Bindable"], function (List, _, Query, ArrayExecutor, Bindable) {

    var Executor = ArrayExecutor.Executor,
        _getValueForItemField = Executor._getValueForItemField;


    Executor._getValueForItemField = function (item, field) {
        if (item instanceof Bindable) {
            return item.get(field);
        }

        return _getValueForItemField(item, field);
    };

    return List.inherit("js.data.QueryList", {

        defaults: {
            list: null,
            query: null,
            filterFnc: null,
            sortFnc: null
        },

        ctor: function (options) {
            this.callBase([], options);
        },

        _commitChangedAttributes: function (attributes) {
            this.callBase();

            if (attributes.hasOwnProperty("list")) {
                var list = attributes.list;
                if (list && list instanceof List) {
                    this._innerReset(list.$items);
                } else {
                    this._innerReset([]);
                }
            }

            if (attributes.hasOwnProperty("query") || attributes.hasOwnProperty("filterFnc")) {
                this._onQueryChanged();
            }
        },

        initialize: function () {
            this.callBase();

            this.bind('list', 'add', this._onItemAdded, this);
            this.bind('list', 'remove', this._onItemRemoved, this);
            this.bind('list', 'item:change', this._onItemChanged, this);
            this.bind('list', 'reset', this._onReset, this);
            this.bind('list', 'sort', this._onSort, this);

        },

        _onQueryChanged: function () {
            this._innerReset(this.$.list ? this.$.list.$items : []);
        },

        _onReset: function () {
            this._innerReset(this.$.list ? this.$.list.$items : []);
        },

        _onItemAdded: function (e) {
            var ret = this._filterItem(e.$.item, e.index);
            if (ret === true) {
                var index = e.$.index,
                    items = this._sortItems(this.$items.concat([e.$.item]));

                if (items) {
                    index = items.indexOf(e.$.item);
                }

                var size = this.size();
                if (index >= size) {
                    index = size - 1;
                }
                this.add(e.$.item, {index: index});
            }
        },

        _sortItems: function (items) {
            if (items) {
                if (this._queryHasSort()) {
                    return Executor.sortItems(this.$.query, items);
                } else if (this.$.sortFnc) {
                    return items.sort(this.$.sortFnc);
                }
            }
            return null;
        },

        _onItemRemoved: function (e) {
            this.remove(e.$.item, e.$.index);
        },

        _onItemChanged: function (e) {
            var keep = this._filterItem(e.$.item, e.$.index),
                included = _.include(this.$.list.$items, e.$.item);

            if (included && keep === false) {
                this.remove(e.$.item, e.$.index);
            } else if (!included && keep === true) {
                var index = e.$.index,
                    items = this._sortItems(this.$items.concat([e.$.item]));

                if (items) {
                    index = items.indexOf(e.$.item);
                }
                this.add(e.$.item, {index: index});
            } else if (included && keep === true && this._queryHasSort()) {
                items = Executor.sortItems(this.$.query, this.$items);
                index = items.indexOf(e.$.item);
                var oldIndex = this.indexOf(e.$.item);

                if (oldIndex !== index) {
                    this.removeAt(oldIndex);
                    this.add(e.$.item, {index: index});
                }
            }
        },

        _innerReset: function (items) {
            var filtered = [], item;
            for (var i = 0; i < items.length; i++) {
                item = items[i];
                if (this._filterItem(item, i) === true) {
                    filtered.push(item);
                }
            }

            filtered = this._sortItems(filtered) || filtered;

            this.reset(filtered);
        },

        _queryHasSort: function () {
            return (this.$.query && this.$.query.hasSortExpressions()) || this.$.sortFnc;
        },

        _filterItem: function (item, index) {
            var ret = true;
            if (this.$.filterFnc) {
                ret = ret && this.$.filterFnc.call(this, item, index, this);
            }
            if (this.$.query) {
                ret = ret && !!Executor._filterItem(item, this.$.query.where());
            }
            return ret;
        }
    });
});