define(
    ["js/ui/ItemsView", "js/html/HtmlElement", "underscore", "js/core/List"], function (ItemsView, HtmlElement, _, List) {
        return ItemsView.inherit("js.ui.SelectionView",{
            $classAttributes: [
                "needsSelection", "multiSelect", "selectedView","selectedViews","selectedItems","selectedIndex","items", "forceSelectable"
            ],
            $defaultTemplateName: null,
            defaults: {
                needsSelection: false,
                multiSelect: false,
                selectedViews: List,
                selectedItems: List,
                selectedItem: null,
                items: [],
                forceSelectable: true
            },
            ctor: function(){
                this.callBase();
                this.bind(['selectedItems','add'], this._onSelectedItemAdd, this);
                this.bind(['selectedItems','remove'], this._onSelectedItemRemove, this);
                this.bind(['selectedItems','reset'], this._onSelectedItemReset, this);
            },
            _onSelectedItemAdd: function(e){
                var item;
                for (var i = 0; i < this.$renderedItems.length; i++) {
                    item = this.$renderedItems[i].item;
                    if(e.$ === item && !this.$renderedItems[i].component.$.selected){
                        this.$renderedItems[i].component.set({selected: true});
                    }
                }
            },
            _onSelectedItemRemove: function(e){
                var item;
                for (var i = 0; i < this.$renderedItems.length; i++) {
                    item = this.$renderedItems[i].item;
                    if (e.$ === item && this.$renderedItems[i].component.$.selected) {
                        this.$renderedItems[i].component.set({selected: false});
                    }
                }
            },
            _onSelectedItemReset: function () {
                this._renderSelectedItems(this.$.selectedItems);
            },
            hasSelectedItems: function () {
                return this.$.selectedItems.length > 0;
            },
            hasSelection: function () {
                return this.$.selectedViews.length > 0;
            }.onChange('selectedViews'),
            _renderChild: function (child) {
                if (child instanceof HtmlElement) {
                    var self = this;
                    if (this.$.forceSelectable === true) {
                        child.set({selectable: true});
                    }
                    child.bind('change:selected', function (e, c) {
                        self._onChildSelected(c);
                    }, child);
                }
                this.callBase();
                if (this.$.needsSelection === true && this.$.selectedItem === null && this.hasSelection() === false) {
                    child.set({selected: true});
                } else {
                    // get item for child, if item is in selectedItems, select child!
                    var item = child.get(this._getItemKey());
                    if (item) {
                        for (var i = 0; i < this.$.selectedItems.length; i++) {
                            if (item === this.$.selectedItems[i]) {
                                child.set({selected: true});
                                break;
                            }
                        }
                        if(item === this.$.selectedItem){
                            child.set({selected: true});
                        }
                    }
                }
            },
            _renderSelectedItem: function (item) {
                var comp = this.getComponentForItem(item);
                if (comp) {
                    comp.set({selected: true});
                }
            },
            _renderSelectedItems: function (list) {
                var item;
                for (var i = 0; i < this.$renderedItems.length; i++) {
                    item = this.$renderedItems[i].item;
                    this.$renderedItems[i].component.set({selected: (list.indexOf(item) > -1)});
                }
            },
            _renderSelectedIndex: function (i) {
                if (i != null && i > -1 && i < this.$renderedChildren.length) {
                    this.$renderedChildren[i].set({selected: true});
                }
            },
            _onChildSelected: function (child) {
                var c, i;
                var checkMultiSelect = (child.$.selected === true && this.$.multiSelect === false),
                    checkMinSelect = !checkMultiSelect && (child.$.selected === false && this.$.needsSelection === true),
                    correctSelection = false,
                    somethingSelected = false,
                    selectedChildren = [],
                    selectedItems = [],
                    selectedIndex,
                    selectedItem = null;

                for (i = 0; i < this.$renderedChildren.length; i++) {
                    c = this.$renderedChildren[i];
                    if (checkMultiSelect) {
                        if (c != child && c.$.selected === true) {
                            correctSelection = true;
                            c.set({selected: false});
                        }
                    } else if (checkMinSelect && c.$.selected === true) {
                        somethingSelected = true;
                    }
                    if (c.$.selected === true) {
                        selectedIndex = i;
                        selectedChildren.push(c);
                        var item = c.get(this._getItemKey());
                        if (item) {
                            selectedItems.push(item);
                            selectedItem = item;
                        }
                    }
                }
                if (this.$.needsSelection === true && somethingSelected === false && child.$.selected === false) {
                    child.set({selected: true});
                    correctSelection = true;
                }

                if (!correctSelection) {
                    this.set({selectedViews: selectedChildren, selectedIndex: selectedIndex, selectedItem: selectedItem});
                    this.$.selectedItems.reset(selectedItems);
                }
            }
        });
    }
);