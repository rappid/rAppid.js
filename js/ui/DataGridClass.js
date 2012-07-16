define(['js/ui/View', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore'], function (View, DataGridColumn, List, _) {

    return View.inherit('js.ui.DataGridClass', {

        defaults: {
            $columns: List,
            rowHeight: 30,
            width: null,
            prefetchItemCount: 0,
            selectedItems: List
        },

        $classAttributes: ['rowHeight','itemWidth', 'prefetchItemCount', 'selectedItems'],

        addChild: function (child) {
            this.callBase();

            if (child instanceof DataGridColumn) {
                this.$.$columns.add(child);
            }
        },
        removeChild: function(child) {
            this.$.$columns.remove(child);
        },
        _propagateDblClick: function(e, row){
            console.log("dblclicked", row);
        }

    });
});