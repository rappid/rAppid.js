rAppid.defineClass("js.ui.ItemsView",
    ["underscore", "js.ui.View", "js.core.Template"], function (_, UIComponent, Template) {
        return UIComponent.inherit({
            _defaults: {
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
                var item, comp;
                for(var i = 0 ; i < items.length; i++){
                    item = items[i];
                    if(this.$itemRendererFnc){
                        this.addChild(this.$itemRendererFnc(item));
                    }else if(this.$itemRenderer){
                        comp = this.$itemRenderer.createComponent();
                        comp.setVar('item',item);
                        this.addChild(comp);
                    }
                }
            }
        });
    }
);