define(["js/ui/ItemsView", "js/html/HtmlElement", "underscore", "js/core/List"], function (ItemsView, HtmlElement, _, List) {

    return ItemsView.inherit("js.ui.SelectionView", {

        $defaultTemplateName: null,

        defaults: {
            /**
             * If multi selection is allowed or not
             */
            multiSelect: false,
            /**
             * The default place holder value if a placeholder template is defined
             */
            placeHolderValue: null,
            /**
             * The list of selected views
             */
            selectedViews: List,
            /**
             * The list of selected items
             */
            selectedItems: List,
            /**
             * The selected item
             */
            selectedItem: null,
            /**
             * The selected view index
             */
            selectedIndex: null,
            /**
             * If true, the first element is selected if no selectedItem is set
             */
            needsSelection: false,
            /**
             * The items
             * @type js.core.List
             * @type Array
             */
            items: [],
            /**
             * A key path for comparison of items
             */
            keyPath: null,
            /**
             * If false, elements are not selectable
             * Useful for readonly selection
             * @type Boolean
             */
            forceSelectable: true,
            /***
             * If true an element can be deselected
             * Default is false
             *
             * @type Boolean
             */
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
            var $renderedItems = this.$repeat.$renderedItems;
            for (var i = 0; i < $renderedItems.length; i++) {
                item = $renderedItems[i].item;
                if (e.$ === item && !$renderedItems[i].component.$.selected) {
                    $renderedItems[i].component.set({selected: true}, {silent: true});
                }
            }
        },

        _onSelectedItemRemove: function (e) {
            var item;
            var $renderedItems = this.$repeat.$renderedItems;
            for (var i = 0; i < $renderedItems.length; i++) {
                item = $renderedItems[i].item;
                if (e.$ === item && $renderedItems[i].component.$.selected) {
                    $renderedItems[i].component.set({selected: false}, {silent: true});
                }
            }
        },

        _onSelectedItemReset: function () {
            this._renderSelectedItems(this.$.selectedItems);
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


        _onItemsRendered: function () {
            this.callBase();

            if (this.$.needsSelection) {
                var items = this._getItemsArray(this.$.items);
                if (items && items.length) {
                    for (var i = 0; i < items.length; i++) {
                        if (this.$.selectedItem === items[i]) {
                            return;
                        }
                    }
                    this.set('selectedItem', items[0]);
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
                    child.set({selected: true}, {silent: true});
                }
            }


            if (this.$.needsSelection && !this.$.selectedItem) {
                this.set('selectedItem', child.get(this._getItemKey()));
            }

        },

        _addTemplate: function (template) {
            this.callBase();
            if (template.$.name == "placeHolder") {
                this.$hasPlaceHolder = true;
            }
        },

        _renderPlaceHolderValue: function (placeHolderValue, oldValue) {
            if (this.$placeHolder) {
                this.removeChild(this.$placeHolder);
            }

            if (this.$hasPlaceHolder) {
                var attr = {};
                attr[this._getItemKey()] = placeHolderValue;
                attr["selected"] = this.$.selectedItem === placeHolderValue;
                this.$placeHolder = this.$templates.placeHolder.createInstance(attr);

                this.addChild(this.$placeHolder, {childIndex: 0});
            }
        },

        _renderSelectedItem: function (item, oldItem) {
            var comp = this.getComponentForItem(item);
            if (this.$hasPlaceHolder && item === this.$.placeHolderValue) {
                comp = this.$placeHolder;
            }
            if (comp) {
                comp.set({selected: true}, {silent: true});
                var c;
                if (!this.$.multiSelect) {
                    for (var i = 0; i < this.$renderedChildren.length; i++) {
                        c = this.$renderedChildren[i];
                        if (c != comp && c.$.selected === true) {
                            c.set({selected: false}, {silent: true});
                        }
                    }
                }
            } else {
                if (oldItem != null && !this.$.multiSelect) {
                    comp = this.getComponentForItem(oldItem);
                    comp && comp.set({selected: false}, {silent: true});
                }
            }
        },

        _renderSelectedItems: function (list) {
            if (list && list.length) {
                var item;
                var $renderedItems = this.$repeat.$renderedItems;
                for (var i = 0; i < $renderedItems.length; i++) {
                    item = $renderedItems[i].item;
                    $renderedItems[i].component.set({selected: (list.indexOf(item) > -1)}, {silent: true});
                }
            } else if (this.$placeHolder) {
                this.$placeHolder.set({selected: true}, {silent: true});
            }
        },

        _renderSelectedIndex: function (i, oldIndex) {
            if (i !== null && i < this.$renderedChildren.length && i > -1) {
                var c = this.$renderedChildren[i];
                c.set({selected: true}, {silent: true});
            }
            if (oldIndex !== null && oldIndex < this.$renderedChildren.length && oldIndex > -1) {
                var oc = this.$renderedChildren[oldIndex];
                oc.set({selected: false}, {silent: true});
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
                    if (item != null) {
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
});