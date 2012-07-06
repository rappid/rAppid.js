define(['js/ui/View', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore'], function (View, DataGridColumn, List, _) {

    return View.inherit('js.ui.DataGridClass', {

        defaults: {
            $columns: List,
            rowHeight: 30,
            cols: 1,
            prefetchItemCount: 0
        },

        $classAttributes: ['rowHeight'],

        addChild: function (child) {

            this.callBase();

            if (child instanceof DataGridColumn) {
                this.$.$columns.add(child);
            }
        },
        removeChild: function(child) {
            this.$.$columns.remove(child);
        }
    });
});