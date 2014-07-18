define(["js/core/Component", "js/core/Bindable", "js/core/List"], function (Component, Bindable, List) {

    return Component.inherit('js.core.Repeat', {
        defaults: {
            /**
             * An array or a List of items
             *
             * @type Array | js.core.List
             */
            items: null,
            /**
             * The key you want to use in the item template
             * @type String
             */
            itemKey: 'item',
            /**
             * The key you want to use for the index
             * @type String
             */
            indexKey: 'index',
            /**
             * KeyPath is used for item comparison.
             * If it's not set the default === comparison is used.
             * @type String
             */
            keyPath: null
        },

        events: ["on:itemsRendered"],

        $defaultTemplateName: "item",

        ctor: function () {
            this.$renderedItems = [];
            this.$renderedItemsMap = {};
            this.callBase();

            this.bind('items', 'sort', this._onSort, this);
            this.bind('items', 'reset', this._onReset, this);
            this.bind('items', 'add', this._onItemAdd, this);
            this.bind('items', 'remove', this._onItemRemove, this);
        },

        /***
         * Renders the given items
         * @private
         */
        _commitChangedAttributes: function ($) {
            this.callBase($);
            if ($.hasOwnProperty("items")) {
                this._innerRenderItems(this._getItemsArray($.items));
            }
        },
        /**
         * Returns an array of the items
         * @param items
         * @returns {Array}
         * @private
         */
        _getItemsArray: function (items) {
            if (!items) {
                return [];
            } else if (items instanceof List) {
                return items.$items;
            } else if (_.isArray(items)) {
                return items;
            }
            return [];
        },
        /***
         * This method is called when the sort event is fired,
         * It reorders the items in the list
         * @param {js.core.Event} [event]
         * @private
         */
        _onSort: function (event) {
            var item, c;
            for (var i = 0; i < event.$.items.length; i++) {
                item = event.$.items[i];
                c = this.getComponentForItem(item);
                // TODO:
                this.$parent.removeChild(c);
                this._innerAddChild(c);
            }
        },
        _onReset: function (e) {
            this._innerRenderItems(e.$.items);
        },

        _onItemAdd: function (e) {
            this._innerRenderItem(e.$.item, e.$.index);
        },

        _onItemRemove: function (e) {
            this._removeRenderedItem(e.$.item);
        },
        /**
         * Inner render method for a list of items
         * All rendered items will be removed and destroyed before rendering
         * @param {Array} items[]
         * @private
         */
        _innerRenderItems: function (items) {
            var c,
                j;
            if (this.$renderedItems) {
                for (j = this.$renderedItems.length - 1; j >= 0; j--) {
                    c = this.$renderedItems[j];
                    this.$parent.removeChild(c.component);
                    c.component.destroy();
                }
            }
            if (this.$renderedItemsMap) {
                var itemList;
                for (var key in this.$renderedItemsMap) {
                    if (this.$renderedItemsMap.hasOwnProperty(key)) {
                        itemList = this.$renderedItemsMap[key];
                        for (j = itemList.length - 1; j >= 0; j--) {
                            c = itemList[j];
                            this.$parent.removeChild(c.component);
                            c.component.destroy();
                        }
                    }
                }
            }
            this.$renderedItems = [];
            this.$renderedItemsMap = {};
            this.$indexOffset = 0;

            if (items) {
                for (var i = 0; i < items.length; i++) {
                    this._innerRenderItem(items[i], i);
                }
            }
            this.trigger("on:itemsRendered", {}, this);
        },
        /***
         * Creates a component based on the template for a given item
         * @param {Object} item
         * @param {Number} index
         * @return {js.core.Component} component
         * @private
         */
        _createComponentForItem: function (item, index) {
            var attr = {};
            attr[this._getItemKey()] = item;
            attr[this._getIndexKey()] = index;

            var virtualParent = this.createComponent(Component, attr);
            virtualParent.$cidScope = virtualParent;
            var templateItem = this.$templates.item;
            virtualParent.$parentScope = templateItem;
            virtualParent.$rootScope = templateItem.$rootScope;
            virtualParent._initialize();
            var component = templateItem.createComponents(attr, virtualParent, virtualParent)[0];
            if (component.$classAttributes) {
                component.$classAttributes.push(this.$.itemKey, this.$.indexKey);
            }
            return component;
        },
        /***
         * Caches the component to a given item
         * @param {Object} item
         * @param {js.core.Component} component
         * @return {js.core.Component} returns the component
         * @private
         */
        _cacheComponentForItem: function (item, component) {
            var key = this._getKeyForItem(item),
                cacheItem = {
                    item: item,
                    component: component
                };
            if (key) {
                if (this.$renderedItemsMap[key]) {
                    this.$renderedItemsMap[key].push(cacheItem);
                } else {
                    this.$renderedItemsMap[key] = [cacheItem];
                }
            } else {
                // add to rendered item map
                this.$renderedItems.push(cacheItem);
            }
            return component;
        },
        /***
         * Calculates a cache key for a given item.
         * If a keyPath is set, it will return the value of the path
         * Otherwise if the item is a {js.core.Bindable} it will return the $cid
         * If no keyPath is set and it's an object it will return null;
         *
         * @param item
         * @return {*}
         * @private
         */
        _getKeyForItem: function (item) {
            if (item instanceof Bindable) {
                if (this.$.keyPath) {
                    return item.get(this.$.keyPath);
                } else {
                    return item.$cid;
                }
            } else {
                if (this.$.keyPath && item instanceof Object) {
                    return this.get(item, this.$.keyPath);
                } else if (_.isString(item) || _.isNumber(item)) {
                    return item;
                }
            }
            return null;
        },
        /***
         * Inner render method for an item
         * Creates a component, caches the component and adds the component to the list of children
         * @param {Object} item
         * @param {Number} index
         * @private
         */
        _innerRenderItem: function (item, index) {
            var component = this._createComponentForItem(item, index);
            this._cacheComponentForItem(item, component);
            this._innerAddChild(component, index);
        },
        /**
         * Adds a child element to the right index in the parent element
         * @param {js.core.Element} child - the child to add
         * @param {Number} index - index of item
         * @private
         */
        _innerAddChild: function (child, index) {
            var indexOffset = this._calculateIndexOffsetForChild(child);
            this.$parent.addChild(child, {childIndex: index + indexOffset});
        },
        /***
         * Calculates the index offset for itself
         * @param {js.core.Element} child
         * @returns {number}
         * @private
         */
        _calculateIndexOffsetForChild: function (child) {
            var index = 0,
                element;

            for (var i = 0; i < this.$parent.$children.length; i++) {
                element = this.$parent.$children[i];
                if (element === this) {
                    return ++index;
                } else {
                    index++;
                }
            }
            return index;
        },
        /***
         * Returns the key to access the item in the template
         * @return {String}
         * @private
         */
        _getItemKey: function () {
            return this.$.itemKey;
        },
        /***
         * Returns the key to access the index in the template
         * @return {String}
         * @private
         */
        _getIndexKey: function () {
            return this.$.indexKey;
        },
        /***
         * Removes an item from the list
         * @param {Object} item
         * @private
         */
        _removeRenderedItem: function (item) {
            var ri,
                key = this._getKeyForItem(item),
                list = this.$renderedItems;
            if (key) {
                list = this.$renderedItemsMap[key];
            }
            for (var i = 0; i < list.length; i++) {
                ri = list[i];
                if (key || ri.item === item) {
                    this.$parent.removeChild(ri.component);
                    list.splice(i, 1);
                    ri.component.destroy();
                    return;
                }
            }
        },
        /**
         * Returns the rendered component to a given item
         * @param item
         * @return {js.core.Component} component
         */
        getComponentForItem: function (item) {
            var key = this._getKeyForItem(item),
                list = this.$renderedItems;
            if (key) {
                list = this.$renderedItemsMap[key];
            }
            if (list) {
                var ri;
                for (var i = 0; i < list.length; i++) {
                    ri = list[i];
                    if (key || ri.item === item) {
                        return ri.component;
                    }
                }
            }
            return null;
        }

    });

});