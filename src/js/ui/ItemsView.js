rAppid.defineClass("js.ui.ItemsView",
    ["underscore", "js.core.UIComponent", "js.core.Template"], function (_, UIComponent, Template) {
        return UIComponent.inherit({
            _defaults: {
                tagName: "div",
                items: []
            },
            _initializeChildren: function(children){
                this.base._initializeChildren.callBase(this,children);
                // find the itemRenderer
                var child;
                for(var i = 0; i < children.length; i++){
                    child = children[i];
                    if(child instanceof Template){
                        this.$itemRenderer = child;
                        break;
                    }
                }
            },
            _initializeAttributes: function(attributes){
                this.base._initializeAttributes.callBase(this,attributes);

                // if a function is set as itemRenderer
                var itemRenderer = attributes["itemRenderer"];
                if(itemRenderer && _.isFunction(itemRenderer)){
                    this.$itemRendererFnc = itemRenderer;
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