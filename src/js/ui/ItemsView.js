rAppid.defineClass("js.ui.ItemsView",
    ["underscore", "js.ui.View", "js.core.Template"], function (_, View, Template) {
        return View.inherit({
            defaults: {
                tagName: "div",
                items: []
            },
            addItem: function(item){
                this.$.items.push(item);
                if(this.isRendered()){
                    this._renderItem(item);
                }

            },
            _renderItems: function(items){
                var item;
                for (var i = 0; i < items.length; i++) {
                    this._renderItem(items[i]);
                }
            },
            _renderItem: function(item){
                this.addChild(this.$templates['item'].createComponents({$item:item})[0]);
            }
        });
    }
);