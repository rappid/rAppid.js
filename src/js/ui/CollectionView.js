rAppid.defineClass("js.ui.CollectionView",
    ["underscore", "js.core.UIComponent", "js.ui.ItemRenderer"], function (_, UIComponent, ItemRenderer) {
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
                    if(child instanceof ItemRenderer){
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
            _renderAttribute: function(key, attribute){
                if(key == "items"){
                    if(_.isArray(attribute)){
                        this._renderItems(attribute);
                    }
                }
            },
            _renderItems: function(items){
                var item;
                for(var i = 0 ; i < items.length; i++){
                    item = items[i];
                    if(this.$itemRendererFnc){
                        this.addChild(this.$itemRendererFnc(item));
                    }else if(this.$itemRenderer){
                        this.addChild(this.$itemRenderer.createDomElementForItem(item));
                    }
                }
            }
        });
    }
);