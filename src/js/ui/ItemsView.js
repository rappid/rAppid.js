rAppid.defineClass("js.ui.ItemsView",
    ["underscore", "js.ui.View", "js.core.Template"], function (_, UIComponent, Template) {
        return UIComponent.inherit({
            defaults: {
                tagName: "div",
                items: []
            },
            _initializeChildren: function(children){
                this.callBase();
                // find the template
                var child;
                for(var i = 0; i < children.length; i++){
                    child = children[i];
                    if(child instanceof Template){
                        this.$itemRenderer = child;

                        break;
                    }
                }
            },
            _renderItems: function(items){
                // TODO: remove this initialize
                var item, comp;
                for(var i = 0 ; i < items.length; i++){
                    item = items[i];
                    if(this.$itemRenderer){
                        comp = this.$itemRenderer.createComponents({$item: item})[0];
                        this.addChild(comp);
                    }
                }
            }
        });
    }
);