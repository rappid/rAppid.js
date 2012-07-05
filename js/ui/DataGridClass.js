define(['js/ui/VirtualItemsView', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore'], function (VirtualItemsView, DataGridColumn, List, _) {

    return VirtualItemsView.inherit('js.ui.DataGridClass', {

        defaults: {
            $columns: List
        },

        $classAttributes: ['rowHeight'],

        _getScrollContainer: function() {
            return this.get('scrollContainer');
        },

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