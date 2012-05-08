/***
 *
 * Acts as base class for
 *
 * @class js.data.ListView
 */
define(["js/core/Component", "js/core/List" ,"underscore"], function (Component, List ,_) {

    return Component.inherit("js.data.DataView", {

        defaults: {
            filterFnc: function (item, index, list) {
                return true;
            }
        },
        initialize: function(){
            this.$.list = new List();

            if (this.$.baseList && this.$.baseList instanceof List) {
                this._bindList(this.$.baseList);
                this._innerReset(this.$.baseList.$items);
            } else {
                throw "No baseList defined!";
            }
        },
        _unbindList: function (list) {
            if (list) {
                list.unbind('add', this._onItemAdded);
                list.unbind('remove', this._onItemRemoved);
                list.unbind('change', this._onItemChange);
                list.unbind('reset', this._onReset);
                list.unbind('sort', this._onSort);
            }
        },
        _bindList: function (list) {
            if (list) {
                list.bind('add', this._onItemAdded, this);
                list.bind('remove', this._onItemRemoved, this);
                list.bind('change', this._onItemChanged, this);
                list.bind('reset', this._onReset, this);
                list.bind('sort', this._onSort);
            }
        },
        _onReset: function (e) {
            this._innerReset(e.items);
        },
        _onSort: function (e) {
            this.$.list.sort(e.sortFnc);
        },
        _innerReset: function (items) {
            // implement!
        },
        _commitChangedAttributes: function (attributes) {
            this.callBase();

            if (attributes.baseList) {
                this._unbindList(this.$previousAttributes.baseList);
                this._bindList(attributes.baseList);
            }

            this._innerReset(this.$.baseList.$items);
        }
    })
});