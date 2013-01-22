define(
    ["js/ui/ItemsView", "js/html/HtmlElement", "underscore", "js/core/List"], function (ItemsView, HtmlElement, _, List) {
        return ItemsView.inherit("js.ui.SelectionView", {
            $defaultTemplateName: null,
            defaults: {
                multiSelect: false,
                selectedViews: List,
                selectedItems: List,
                selectedItem: null,
                needsSelection: false,
                items: [],
                forceSelectable: true,
                allowDeselection: false
            },
            ctor: function () {
                this.callBase();
                this.bind('selectedItems', 'add', this._onSelectedItemAdd, this);
                this.bind('selectedItems', 'remove', this._onSelectedItemRemove, this);
                this.bind('selectedItems', 'reset', this._onSelectedItemReset, this);
            },
            _onSelectedItemAdd: function (e) {
                var item;
                for (var i = 0; i < this.$renderedItems.length; i++) {
                    item = this.$renderedItems[i].item;
                    if (e.$ === item && !this.$renderedItems[i].component.$.selected) {
                        this.$renderedItems[i].component.set({selected: true},{silent: true});
                    }
                }
            },
            _onSelectedItemRemove: function (e) {
                var item;
                for (var i = 0; i < this.$renderedItems.length; i++) {
                    item = this.$renderedItems[i].item;
                    if (e.$ === item && this.$renderedItems[i].component.$.selected) {
                        this.$renderedItems[i].component.set({selected: false},{silent: true});
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
                if (!this.$.selectedItem) {
                    return false;
                }
                var c,
                    itemKey = this._getItemKey();
                for (var i = 0; i < this.$renderedChildren.length; i++) {
                    c = this.$renderedChildren[i].get(itemKey);
                    if (this._areItemsEqual(c, this.$.selectedItem)) {
                        return true;
                    }
                }
                return false;
            }.onChange('selectedItem'),

            _innerRenderItems: function (items) {

                this.callBase();

                if (this.$.needsSelection) {
                    if (items && items.length) {
                        for (var i = 0; i < items.length; i++) {
                            if (this.$.selectedItem === items[i]) {
                                return;
                            }
                        }
                        this.set('selectedItem', this.$renderedChildren[0].get(this._getItemKey()));
                    } else {
                        this.set('selectedItem', null);
                    }
                }

            },

            _renderChild: function (child) {
                if (child instanceof HtmlElement) {
                    var self = this;
                    if (this.$.forceSelectable === true) {
                        child.set({selectable: true});
                    }
                    child.bind('change:selected', function (e, options) {
                        if (!e.$ && !self.$.allowDeselection) {
                            child.set('selected', true, {silent: true});
                        }
                        if (self.$.allowDeselection || (e.$ && !self.$.allowDeselection)) {
                            self._onChildSelected(e.target);
                        }
                    });
                }
                this.callBase();

                // get item for child, if item is in selectedItems, select child!
                var item = child.get(this._getItemKey());
                if (item) {
                    for (var i = 0; i < this.$.selectedItems.length; i++) {
                        if (this._areItemsEqual(item, this.$.selectedItems[i])) {
                            child.set({selected: true}, {silent: true});
                            break;
                        }
                    }
                    if (this._areItemsEqual(item, this.$.selectedItem)) {
                        child.set({selected: true},{silent: true});
                    }
                }


            },

            _renderSelectedItem: function (item, oldItem) {
                var comp = this.getComponentForItem(item);
                if (comp) {
                    comp.set({selected: true});
                } else {
                    if (oldItem && !this.$.multiSelect) {
                        comp = this.getComponentForItem(oldItem);
                        comp && comp.set({selected: false},{silent: true});
                    }
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
                    correctSelection = false,
                    selectedChildren = [],
                    selectedItems = [],
                    selectedIndex,
                    selectedItem = null;

                for (i = 0; i < this.$renderedChildren.length; i++) {
                    c = this.$renderedChildren[i];
                    if (checkMultiSelect) {
                        if (c != child && c.$.selected === true) {
                            c.set({selected: false}, {silent: true});
                        }
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

                if (!correctSelection) {
                    this.set({selectedViews: selectedChildren, selectedIndex: selectedIndex, selectedItem: selectedItem});
                    this.$.selectedItems.reset(selectedItems);
                }
            },
            _areItemsEqual: function (itemA, itemB) {
                if (this.$.keyPath) {
                    if (!itemA || !itemB) {
                        return false;
                    }
                    return itemA.get(this.$.keyPath) === itemB.get(this.$.keyPath);
                } else {
                    return itemA === itemB;
                }
            }
        });
    }
);