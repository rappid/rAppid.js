define(['js/ui/View', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore', 'js/ui/DataGridItemsViewClass'], function (View, DataGridColumn, List, _, DataGridItemsViewClass) {

    return View.inherit('js.ui.DataGridClass', {

        defaults: {
            $columns: List,
            rowHeight: 45,
            width: null,
            prefetchItemCount: 0,
            selectedItems: List,
            selectionMode: "multi"
        },
        events: ["on:rowClick", "on:rowDblClick"],
        $classAttributes: ['$itemsView','rowHeight'],
        ctor: function(){
            this.callBase();
            this.bind('$itemsView','on:itemClick', this._onRowClick, this);
            this.bind('$itemsView','on:itemDblClick', this._onRowDblClick, this);
        },
        _onRowClick: function(e){
            this.trigger('on:rowClick', e);
        },
        _onRowDblClick: function(e){
            this.trigger('on:rowDblClick', e);
        },
        _initializationComplete: function(){
            this.$classAttributes = this.$classAttributes.concat(this.$.$itemsView.$classAttributes);
            this.callBase();
        },
        addChild: function (child) {
            this.callBase();
            if (child instanceof DataGridColumn) {
                this.$.$columns.add(child);
            }
        },
        focus: function(){
            this.$.$itemsView.focus();
        },
        removeChild: function(child) {
            this.$.$columns.remove(child);
        }
    });
});