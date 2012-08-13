define(['js/ui/VirtualItemsView', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore', 'js/core/Binding', 'js/core/HashMap'], function (VirtualItemsView, DataGridColumn, List, _, Binding, HashMap) {

    var INDEX_ODD = "odd",
        INDEX_EVEN = "even";


    return VirtualItemsView.inherit('js.ui.DataGridClassViewClass', {

        defaults: {
            columns: List,
            cols: 1,
            itemWidth: null,
            data: null,
            prefetchItemCount: 3
        },
        $classAttributes: ['rowHeight', 'columns'],
        _createRenderer: function (attributes) {
            if(attributes){
                delete attributes['width'];
            }
            return this.callBase(attributes);
        },
        _addRenderer: function (renderer, position) {
            this.$.$tbody.addChild(renderer, {childIndex: position});
            var column, columnConfiguration, binding;
            for (var i = 0; i < renderer.$children.length; i++) {
                column = renderer.$children[i];
                columnConfiguration = this.$.columns.at(i);
                if(!column.$children.length){
                    var c = columnConfiguration.createCellRenderer({data: null}, renderer), path = ["$dataItem","data"];
                    var cellContainer = columnConfiguration.createCellContainer(c);
                    if(columnConfiguration.$.path && columnConfiguration.$.path !== ""){
                        path.push(columnConfiguration.$.path);
                    }

                    binding = new Binding({scope: renderer, path: path.join("."), target: c, targetKey: 'data', transform: columnConfiguration.getFormatFnc()});
                    c.set({data: binding.getValue()});
                    if(cellContainer){
                        cellContainer.addChild(c);
                        c = cellContainer;
                    }
                    column.addChild(c);
                }

            }
        },
        removeChild: function(child) {
            this.$.$columns.remove(child);
        },
        _updatedVisibleItems: function(startIndex, endIndex){
            this.$.$table.set('style', ['width: 100%; position: absolute;', 'top:' + (startIndex * this.$.itemHeight) + "px"].join(";"));
        },
        _positionRenderer: function (renderer, addedRenderer, position) {
            // nothing needs to be done
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
        },
        indexStatus: function(index){
            return index % 2 ? INDEX_EVEN : INDEX_ODD;
        },
        focus: function(){
            if(this.isRendered()){
                this.$.$table.$el.focus();
            }
        }
    });
});