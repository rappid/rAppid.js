define(['js/ui/View', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore', 'js/ui/DataGridItemsViewClass', 'js/data/Query'], function (View, DataGridColumn, List, _, DataGridItemsViewClass, Query) {

    return View.inherit('js.ui.DataGridClass', {

        defaults: {
            $columns: List,
            rowHeight: 45,
            width: null,
            prefetchItemCount: 0,
            selectedItems: List,
            selectionMode: "multi",
            data: null
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
        sort: function(sortPath, sortDirection){
            this.$sortQuery = this.$sortQuery || new Query();
            this.$sortQuery.sort((sortDirection === 1 ? "+" : "-") + sortPath);
            this.$sortParamter = this.$sortParameter || {};
            var sortColumn;
            this.$.$columns.each(function(column){
                if(column.getSortPath() === sortPath){
                    column.set('sortDirection', sortDirection);
                    sortColumn = column;
                } else {
                    column.set('sortDirection', 0);
                }
            });
            if(sortColumn){
                this.$sortParamter[sortPath] = sortColumn.$.sortDirection;
            }
            if (this.$.query) {
                this.$.query.sort(this.$sortQuery.query.sort);
                this.set('query', this.$.query, {force: true});
            } else {
                this.set('query', this.$sortQuery);
            }
        },
        _commitQuery: function (query) {
            if (query) {
                if (this.$sortQuery) {
                    query.sort(this.$sortQuery.query.sort);
                }
                // TODO: if sort parameters are set, use them
                this.$.$itemsView.query(query);
            } else {
                this.$.$itemsView.query(this.$sortQuery || null);
            }
        },
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