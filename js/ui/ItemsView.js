define(
    ["js/ui/View", "js/core/Template", "js/core/List", "js/core/Bindable", "underscore"], function (View, Template, List, Bindable, _) {
        return View.inherit({
            defaults: {
                tagName: "div",
                items: null,
                itemKey: 'item',
                indexKey: 'index',
                keyPath: null
            },

            $classAttributes: [
                'keyPath', 'itemKey', 'indexKey'
            ],

            $defaultTemplateName: 'item',

            ctor: function(){
                this.callBase();

                this.bind('items','sort', this._onSort, this);
                this.bind('items','reset', this._onReset, this);
                this.bind('items','add', this._onItemAdd, this);
                this.bind('items','remove', this._onItemRemove, this);
            },
            /***
             * Returns true if items are available
             */
            hasItems: function () {
                if (this.$.items) {
                    return this.$.items.length;
                }
                return 0;
            }.on('items'),

            render: function () {
                if (!this.isRendered()) {
                    this.$renderedItems = [];
                    this.$renderedItemsMap = {};
                }
                return this.callBase();
            },

            _renderItems: function (items) {
                if(!items){
                    this._innerRenderItems([]);
                }else if (items instanceof List) {
                    this._innerRenderItems(items.$items);
                } else if (_.isArray(items)) {
                    this._innerRenderItems(items);
                }
            },
            _onSort: function (e) {
                if (this.isRendered()) {
                    var item, c;
                    for (var i = 0; i < e.$.items.length; i++) {
                        item = e.$.items[i];
                        c = this.getComponentForItem(item);
                        this.$el.removeChild(c.$el);
                        this.$el.appendChild(c.$el);
                    }
                }
            },

            _onReset: function (e) {
                this._innerRenderItems(e.$.items);
            },

            _onItemAdd: function (e) {
                if(this.isRendered()){
                    this._innerRenderItem(e.$.item, e.$.index);
                }
            },

            _onItemRemove: function (e) {
                if(this.isRendered()){
                    this._removeRenderedItem(e.$.item);
                }
            },
            /**
             * Inner render method for a list of items
             * All rendered items will be removed and destroyed before rendering
             * @param {Array} items[]
             * @private
             */
            _innerRenderItems: function (items) {
                if (this.$renderedItems) {
                    var c;
                    for (var j = this.$renderedItems.length - 1; j >= 0; j--) {
                        c = this.$renderedItems[j];
                        this.removeChild(c.component);
                        c.component.destroy();
                    }
                    for(var key in this.$renderedItemsMap){
                        if(this.$renderedItemsMap.hasOwnProperty(key)){
                            c = this.$renderedItemsMap[key];
                            this.removeChild(c);
                            c.destroy();
                        }
                    }
                }
                this.$renderedItems = [];
                for (var i = 0; i < items.length; i++) {
                    this._innerRenderItem(items[i], i);
                }

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
                return this.$templates['item'].createComponents(attr)[0];
            },
            /***
             * Caches the component to a given item
             * @param {Object} item
             * @param {js.core.Component} component
             * @return {js.core.Component} returns the component
             * @private
             */
            _cacheComponentForItem: function(item,component){
                var key = this._getKeyForItem(item);
                if (key) {
                    this.$renderedItemsMap[key] = component;
                } else {
                    // add to rendered item map
                    this.$renderedItems.push({
                        item: item,
                        component: component
                    });
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
            _getKeyForItem: function(item){
                if (item instanceof Bindable) {
                    var key;
                    if (this.$.keyPath) {
                        return item.get(this.$.keyPath);
                    } else {
                        return item.$cid;
                    }
                } else {
                    if(this.$.keyPath && item instanceof Object){
                        return this.get(item, this.$.keyPath);
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
                this._cacheComponentForItem(item,component);
                this.addChild(component);
            },

            /***
             * Returns the key to access the item in the template
             * @return {String}
             * @private
             */
            _getItemKey: function () {
                return "$" + this.$.itemKey;
            },
            /***
             * Returns the key to access the index in the template
             * @return {String}
             * @private
             */
            _getIndexKey: function () {
                return "$" + this.$.indexKey;
            },
            /***
             * Removes an item from the list
             * @param {Object} item
             * @private
             */
            _removeRenderedItem: function (item) {
                var ri;
                var key = this._getKeyForItem(item);
                var comp;
                if(key){
                    comp = this.$renderedItemsMap[key];
                    this.removeChild(comp);
                    delete this.$renderedItems[key];
                    comp.destroy();
                }else{
                    for (var i = 0; i < this.$renderedItems.length; i++) {
                        ri = this.$renderedItems[i];
                        if (ri.item === item) {
                            this.removeChild(ri.component);
                            this.$renderedItems.splice(i, 1);
                            ri.component.destroy();
                            return;
                        }
                    }
                }
            },
            /**
             * Returns the rendered component to a given item
             * @param item
             * @return {js/core/Component} component
             */
            getComponentForItem: function (item) {
                var key = this._getKeyForItem(item);
                if(key){
                    return this.$renderedItemsMap[key];
                }
                var ri;
                for (var i = 0; i < this.$renderedItems.length; i++) {
                    ri = this.$renderedItems[i];
                    if (ri.item === item) {
                        return ri.component;
                    }
                }
                return null;
            }
        });
    }
);