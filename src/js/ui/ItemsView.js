var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {

    rAppid.defineClass("js.ui.ItemsView",
        ["js.ui.View", "js.core.Template"], function (View, Template) {
            return View.inherit({
                defaults: {
                    tagName: "div",
                    items: []
                },
                hasItems: function(){
                    return this.$.items.length > 0;
                }.on('items'),
                addItem: function (item) {
                    this.$.items.push(item);
                    if (this.isRendered()) {
                        this._renderItem(item);
                    }
                },
                render: function(){
                    this.$renderedItems = [];
                    return this.callBase();
                },
                removeItem: function(){
                    // TODO: implement
                    this.$.hasItems = this.hasItems();
                },
                clear: function(){
                    var c;
                    if(this.$renderedItems){
                        for (var i = 0; i < this.$renderedItems.length; i++) {
                            c = this.$renderedItems[i];
                            if (this.isRendered()) {
                                this.$el.removeChild(c.component.$el);
                            }
                        }
                    }
                    this.$renderedItems = [];
                },
                _renderItems: function (items) {
                    this.clear();
                    var item;
                    for (var i = 0; i < items.length; i++) {
                        this._renderItem(items[i]);
                    }
                },
                _renderItem: function (item) {
                    var comp = this.$templates['item'].createComponents({$item: item})[0];
                    // add to rendered item map
                    this.$renderedItems.push({
                        item: item,
                        component: comp
                    });
                    this.addChild(comp);
                },
                getComponentForItem: function (item) {
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
});