/***
 *
 * Acts as base class for
 *
 * @class js.data.ListView
 */
define(["js/core/Component", "js/core/List" , "underscore"], function (Component, List, _) {

    return Component.inherit("js.data.DataView", {


        initialize: function () {
            this.$.list = new List();
            this.bind('baseList', 'add', this._onItemAdded, this);
            this.bind('baseList', 'remove', this._onItemRemoved, this);
            this.bind('baseList', 'change', this._onItemChanged, this);
            this.bind('baseList', 'reset', this._onReset, this);
            this.bind('baseList', 'sort', this._onSort, this);


        },

        _initializationComplete: function() {

            if (this.$.baseList && this.$.baseList instanceof List) {
                this._innerReset(this.$.baseList.$items);
            }
        },
        _onItemChanged: function () {
            // implement
        },
        _onReset: function (e) {
            this._innerReset(e.items);
        },
        _onSort: function (e) {
            this.$.list.sort(e.sortFnc);
        },
        _innerReset: function (items) {
            // implement
        },
        _innerDestroy: function () {
            this.unbind('baseList', 'add', this._onItemAdded, this);
            this.unbind('baseList', 'remove', this._onItemRemoved, this);
            this.unbind('baseList', 'change', this._onItemChanged, this);
            this.unbind('baseList', 'reset', this._onReset, this);
            this.unbind('baseList', 'sort', this._onSort, this);

            this.callBase();
        }
    })
});