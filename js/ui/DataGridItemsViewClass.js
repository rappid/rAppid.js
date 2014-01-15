define(['js/ui/VirtualItemsView', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore', 'js/core/Binding'], function (VirtualItemsView, DataGridColumn, List, _, Binding) {

    var INDEX_ODD = "odd",
        INDEX_EVEN = "even";


    return VirtualItemsView.inherit('js.ui.DataGridItemsViewClass', {

        defaults: {
            columns: List,
            _cols: 1,
            _itemWidth: null,
            innerTableWidth: "{$table.width}",
            data: null,
            prefetchItemCount: 3
        },
        _createRenderer: function (attributes) {
            if (attributes) {
                delete attributes.width;
            }
            return this.callBase(attributes);
        },
        _addRenderer: function (renderer, position) {
            this.$.$tbody.addChild(renderer, {childIndex: position});
            var column, columnConfiguration, binding, c, cellContainer, val, path,
                children = renderer.getViewChildren();
            for (var i = 0; i < children.length; i++) {
                column = children[i];
                columnConfiguration = this.$.columns.at(i);
                if (!column.$children.length) {
                    c = columnConfiguration.createCellRenderer({data: null}, renderer);
                    path = ["$dataItem", "data"];
                    cellContainer = columnConfiguration.createCellContainer(c);
                    if (columnConfiguration.$.path && columnConfiguration.$.path !== "") {
                        path.push(columnConfiguration.$.path);
                    }

                    binding = new Binding({scope: renderer, path: path.join("."), target: c, targetKey: 'data', transform: columnConfiguration.getFormatFnc()});
                    val = binding.getValue();
                    c.set({data: val});
                    if (cellContainer) {
                        cellContainer.addChild(c);
                        c = cellContainer;
                    }
                    column.addChild(c);
                }

            }
        },
        removeChild: function (child) {
            this.$.$columns.remove(child);
        },
        _onVisibleItemsUpdated: function (startIndex, endIndex) {
            this.$.$table.set('style', ['width: 100%; position: absolute;', 'top:' + (startIndex * this.$._itemHeight) + "px"].join(";"));
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
        render: function () {
            var el = this.callBase();
            this._commitData(this.$.data);
            return el;
        },
        indexStatus: function (index) {
            return index % 2 ? INDEX_EVEN : INDEX_ODD;
        },
        focus: function () {
            if (this.isRendered()) {
                this.$.$table.$el.focus();
            }
        }
    });
});