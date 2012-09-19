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

                this.bind(['items','sort'], this._onSort, this);
                this.bind(['items','reset'], this._onReset, this);
                this.bind(['items','add'], this._onItemAdd, this);
                this.bind(['items','remove'], this._onItemRemove, this);
            },

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

            _createComponentForItem: function (item, i) {
                var attr = {};
                attr[this._getItemKey()] = item;
                attr[this._getIndexKey()] = i;
                var comp = this.$templates['item'].createComponents(attr)[0];

                var key = this._getKeyForItem(item);
                if(key){
                    this.$renderedItemsMap[key] = comp;
                }else{
                    // add to rendered item map
                    this.$renderedItems.push({
                        item: item,
                        component: comp
                    });
                }

                return comp;
            },
            _getKeyForItem: function(item){
                if (item instanceof Bindable) {
                    var key;
                    if (this.$.keyPath) {
                        return item.get(this.$.keyPath);
                    } else {
                        return item.$cid;
                    }
                }
                // TODO: handle hash objects
                return null;
            },
            _innerRenderItem: function (item, i) {
                this.addChild(this._createComponentForItem(item, i));
            },

            _getItemKey: function () {
                return "$" + this.$.itemKey;
            },

            _getIndexKey: function () {
                return "$" + this.$.indexKey;
            },

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