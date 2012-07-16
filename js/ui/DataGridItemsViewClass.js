define(['js/ui/VirtualItemsView', 'xaml!js/ui/DataGridColumn', 'js/core/List', 'underscore', 'js/core/Binding', 'js/core/HashMap'], function (VirtualItemsView, DataGridColumn, List, _, Binding, HashMap) {

    var INDEX_ODD = "odd",
        INDEX_EVEN = "even";


    return VirtualItemsView.inherit('js.ui.DataGridClass', {

        defaults: {
            columns: List,
            cols: 1,
            itemWidth: null,
            data: null,
            prefetchItemCount: 3,
            selectedItems: List
        },
        events: ["on:rowDblClick"],
        ctor: function(){
            this.$currentSelectionIndex = null;
            this.$selectionMap = {};
            this.$selectedViews = {};
            this.callBase();
        },
        $classAttributes: ['rowHeight', 'columns', 'selectedItems'],

        _addRenderer: function (renderer, position) {
            this.$.$tbody.addChild(renderer, {childIndex: position});
            var column, columnConfiguration, binding;
            for (var i = 0; i < renderer.$children.length; i++) {
                column = renderer.$children[i];
                columnConfiguration = this.$.columns.at(i);

                if(!column.$children.length){
                    var c = columnConfiguration.createCellRenderer({data: null}), path = ["$dataItem","data"];
                    if(columnConfiguration.$.path && columnConfiguration.$.path !== ""){
                        path.push(columnConfiguration.$.path);
                    }

                    binding = new Binding({scope: renderer, path: path.join("."), target: c, targetKey: 'data', transform: columnConfiguration.getFormatFnc()});
                    c.set({data: binding.getValue()});
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
        _onKeyDown: function(e){
            if(e.domEvent.keyCode === 38 || e.domEvent.keyCode == 40){
                var up = (e.domEvent.keyCode == 38);
                var index = this.$currentSelectionIndex ? this.$currentSelectionIndex : 0;
                index = index + (up ? -1 : 1);
                if(index < 0){
                    index = 0;
                }
                this._selectItem(index, e.domEvent.shiftKey, false);
                e.preventDefault();
                e.stopPropagation();
            }

        },
        _selectItem: function(index, shiftDown, metaKey){
          if (!metaKey) {
                for (var key in this.$selectionMap) {
                    if (this.$selectionMap.hasOwnProperty(key)) {
                        this.$selectionMap[key].set({selected: false});
                        this.$.selectedItems.remove(this.$selectionMap[key].$.data);
                        delete this.$selectionMap[key];
                    }
                }
            }

            if (!shiftDown || metaKey) {
                this.$lastSelectionIndex = index;
            }
            var startIndex, endIndex;
            if (this.$lastSelectionIndex !== undefined && index < this.$lastSelectionIndex) {
                startIndex = index;
                endIndex = this.$lastSelectionIndex;
            } else {
                startIndex = this.$lastSelectionIndex;
                endIndex = index;
            }
            this.$currentSelectionIndex = index;
            var item, id;
            for (var i = startIndex; i <= endIndex; i++) {
                item = this.$.$dataAdapter.getItemAt(i);
                id = item.get('data.$cid');
                if (id) {
                    if (metaKey && item.$.selected) {
                        delete this.$selectionMap[id];
                        this.$.selectedItems.remove(item.$.data);
                        item.set('selected', false);
                    } else {
                        this.$selectionMap[id] = item;
                        this.$.selectedItems.add(item.$.data);
                        item.set('selected', true);

                    }
                } else {
                    console.log("no id defined");
                }
            }

            var diff = 0;
            if (index > this.$lastEndIndex) {
                diff = index - this.$lastEndIndex;
            } else if (index < this.$lastStartIndex) {
                diff = index - this.$lastStartIndex;
            }
            this.$el.scrollTop = this.$.scrollTop + diff * this.$.itemHeight;

            if (!shiftDown) {
                this.$lastSelectionIndex = index;
            }
        },
        _onRendererClick: function(e, row){
            this._selectItem(row.$.$index, e.domEvent.shiftKey, e.domEvent.metaKey);
        },
        _onRendererDblClick: function(e, row){
            this.trigger('on:rowDblClick', e, row);
        },
        render: function() {
            var el = this.callBase();
            this._commitData(this.$.data);
            return el;
        },
        indexStatus: function(index){
            return index % 2 ? INDEX_EVEN : INDEX_ODD;
        },
        isItemSelected: function(data){
            if(!data){
                return false;
            }
            var cid = data.$cid;
            console.log(cid);
            return cid && this.$.selectedItems[cid] !== undefined;
        }
    });
});