define(['js/ui/VirtualItemsView', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore'], function (VirtualItemsView, DataGridColumn, List, _) {

    return VirtualItemsView.inherit('js.ui.DataGridClass', {

        defaults: {
            columns: List,
            cols: 1,
            itemWidth: null,
            prefetchItemCount: 0
        },
        ctor: function(){
            this.callBase();
        },
        $classAttributes: ['rowHeight', 'columns'],

        _addRenderer: function (renderer, position) {
            this.$.$table.addChild(renderer, {childIndex: position});
            var column, columnConfiguration, data;
            for (var i = 0; i < renderer.$children.length; i++) {
                column = renderer.$children[i];
                columnConfiguration = this.$.columns.at(i);

                data = {data: renderer.$.dataItem.get(columnConfiguration.$.path)};
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
            this.$.$table.set('style', ['width: 100%; position: absolute;', 'top:' + ((renderer.$.index - renderer.$.viewIndex) * this.$.itemHeight)+ "px"].join(";"));
        }

    });
});