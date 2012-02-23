var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {

    rAppid.defineClass("js.ui.ItemsView",
        ["underscore", "js.ui.View", "js.core.Template"], function (_, View, Template) {
            return View.inherit({
                defaults: {
                    tagName: "div",
                    items: []
                },
                addItem: function (item) {
                    this.$.items.push(item);
                    if (this.isRendered()) {
                        this._renderItem(item);
                    }

                },
                _renderItems: function (items) {
                    this.$renderedItems = [];
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