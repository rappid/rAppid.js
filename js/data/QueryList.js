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
            filterFnc: null
        },

        ctor: function(options){

            this.callBase([],options);
        },

        _commitList: function(list){
            if (list && list instanceof List) {
                this._innerReset(list.$items);
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
        _onFilterChanged: function () {
            this._innerReset(this.$.list.$items);
        },
        _onItemAdded: function (e) {
            var ret = this._filterItem(e.$.item, e.index);
            if (ret === true) {
                this.add(e.$.item, e.index);
            }
        },
        _onItemRemoved: function (e) {
            this.remove(e.$.item, e.$.index);
        },
        _onItemChanged: function (e) {
            var keep = this._filterItem(e.$.item, e.$.index);
            var included = _.include(this.$.list.$items, e.$.item);
            if (included && keep === false) {
                this.remove(e.$.item, e.$.index);
            } else if (!included && keep === true) {
                this.add(e.$.item, e.$.index);
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
            this.reset(filtered);
        },
        _filterItem: function (item, index) {
            if (this.$.filterFnc) {
                return this.$.filterFnc.call(this, item, index, this);
            } else if(this.$.query) {
                return !!Executor._filterItem(item, this.$.query.where());
            }
            return true;
        }
    })
});