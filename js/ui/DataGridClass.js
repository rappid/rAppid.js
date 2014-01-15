define(['js/ui/View', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore', 'js/ui/DataGridItemsViewClass', 'js/data/Query', "js/data/Collection"], function (View, DataGridColumn, List, _, DataGridItemsViewClass, Query, Collection) {

    return View.inherit('js.ui.DataGridClass', {

        defaults: {
            $columns: List,
            rowHeight: 45,
            width: null,
            prefetchItemCount: 0,
            selectedItems: List,
            selectionMode: "multi",
            data: null,
            query: null
        },

        events: [
        /***
         * The rowClick event is dispatched if a row is clicked in the DataGrid.
         */
            "on:rowClick",
        /***
         * The rowDblClick event is dispatched if a row is double clicked in the DataGrid.
         */
            "on:rowDblClick"
        ],

        ctor: function () {
            this.callBase();
            this.bind('$itemsView', 'on:itemClick', this._onRowClick, this);
            this.bind('$itemsView', 'on:itemDblClick', this._onRowDblClick, this);
        },
        _onRowClick: function (e) {
            this.trigger('on:rowClick', e);
        },
        _onRowDblClick: function (e) {
            this.trigger('on:rowDblClick', e);
        },
        _initializationComplete: function () {
            this.$classAttributes = this.$classAttributes.concat(this.$.$itemsView.$classAttributes);
            this.callBase();
            var self = this;
            this.$.$itemsView.bind('change:innerTableWidth', function (e) {
                if (e.$) {
                    self.$.$head.set('width', e.$);
                }
            });
        },
        _handleColumnClick: function (e) {
            if (this.$.data) {
                var column = e.target.$.column;
                var path = column.getSortPath();
                // add sortable attribute
                if (path) {
                    var sortDirection = column.$.sortDirection === 0 ? 1 : column.$.sortDirection;
                    sortDirection = sortDirection === 1 ? -1 : 1;
                    this.sort(path, sortDirection);
                }
            }
        },
        sort: function (sortPath, sortDirection) {
            var sortQuery = new Query();
            sortQuery.sort((sortDirection === 1 ? "+" : "-") + sortPath);
            this.$sortParamter = this.$sortParameter || {};
            var sortColumn;
            this.$.$columns.each(function (column) {
                if (column.getSortPath() === sortPath) {
                    column.set('sortDirection', sortDirection);
                    sortColumn = column;
                } else {
                    column.set('sortDirection', 0);
                }
            });
            if (sortColumn) {
                this.$sortParamter[sortPath] = sortColumn.$.sortDirection;
            }
            this.set('sortQuery', sortQuery);
        },

        _data: function () {
            var data = this.$.data;
            if (data instanceof Collection) {
                if (this.$.query) {
                    data = data.query(this.$.query);
                }
                if (this.$.sortQuery) {
                    data = data.sort(this.$.sortQuery);
                }
            }
            return data;
        }.onChange("data", "sortQuery", "query"),

        addChild: function (child) {
            this.callBase();
            if (child instanceof DataGridColumn) {
                this.$.$columns.add(child);
            }
        },
        focus: function () {
            this.$.$itemsView.focus();
        },
        removeChild: function (child) {
            this.$.$columns.remove(child);
        }
    });
});