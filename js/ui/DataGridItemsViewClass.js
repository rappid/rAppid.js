define(['js/ui/VirtualItemsView', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore', 'js/core/Binding'], function (VirtualItemsView, DataGridColumn, List, _, Binding) {

    return VirtualItemsView.inherit('js.ui.DataGridClass', {

        defaults: {
            columns: List,
            cols: 1,
            itemWidth: null,
            data: null,
            prefetchItemCount: 3
        },
        ctor: function(){
            this.callBase();
        },
        $classAttributes: ['rowHeight', 'columns'],

        _addRenderer: function (renderer, position) {
            this.$.$tbody.addChild(renderer, {childIndex: position});
            var column, columnConfiguration, binding;
            for (var i = 0; i < renderer.$children.length; i++) {
                column = renderer.$children[i];
                columnConfiguration = this.$.columns.at(i);

                if(!column.$children.length){
                    var c = columnConfiguration.createCellRenderer({data: null});
                    binding = new Binding({scope: renderer, path: "$dataItem.data."+(columnConfiguration.$.path || ""), target: c, targetKey: 'data'});
                    c.set({data: binding.getValue()});
                    column.addChild(c);
                }

            }
        },

        removeChild: function(child) {
            this.$.$columns.remove(child);
        },

        _positionRenderer: function (renderer, addedRenderer, position) {
            this.$.$table.set('style', ['width: 100%; position: absolute;', 'top:' + ((renderer.$.$index - renderer.$.$viewIndex) * this.$.itemHeight)+ "px"].join(";"));
        },

        _commitData: function (data) {
            if (!this.$el) {
                return;
            }

            this.callBase();
        },

        render: function() {
            var el = this.callBase();

            this._commitData(this.$.data);

            return el;
        }

    });
});