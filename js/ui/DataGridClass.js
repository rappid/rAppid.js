define(['js/ui/VirtualItemsView', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore'], function (VirtualItemsView, DataGridColumn, List, _) {

    return VirtualItemsView.inherit('js.ui.DataGridClass', {

        defaults: {
            $columns: List,
            cols: 1,
            itemWidth: 300,
            prefetchItemCount: 0
        },

        $classAttributes: ['rowHeight'],

        _getScrollContainer: function() {
            return this.get('$scrollContainer');
        },
        addChild: function (child) {

            this.callBase();

            if (child instanceof DataGridColumn) {
                this.$.$columns.add(child);
            }
        },
        _addRenderer: function (renderer) {
            this.$.$tbody.addChild(renderer);
            var column, columnConfiguration, data;
            for (var i = 0; i < renderer.$children.length; i++) {
                column = renderer.$children[i];
                columnConfiguration = this.$.$columns.at(i);

                data = {data: renderer.$.data.get(columnConfiguration.$.path)};
                if(!column.$children.length){
                    var c = columnConfiguration.createCellRenderer(data);
                    column.addChild(c);
                }else{
                    column.$children[0].set(data)
                }

            }
        },
        removeChild: function(child) {
            this.$.$columns.remove(child);
        },
        _positionRenderer: function (renderer, addedRenderer, position) {
            if(position === 0){
                this.$.$tbody.set('style',['position: absolute;','top:'+this.$.scrollTop+"px"].join(";"));

            }
        }

    });
});