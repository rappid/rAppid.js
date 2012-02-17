rAppid.defineClass("js.ui.Placeholder",
    ["underscore", "js.core.UIComponent", "js.core.Content"], function (_, UIComponent, Content) {
        return UIComponent.inherit({
            defaults: {

            },
            render: function(){
                if(this.isRendered()){
                    return this.$el;
                }

                this.$textNode = document.createTextNode("");
                this.$el = this.$textNode;

                return this.$el;
            },
            clear: function(){
                this.set({content: this.$textNode});
            },
            _renderContent: function(content){
                var children;
                if(content instanceof Content){
                    children = content.$children;
                }else if(_.isArray(content)){
                    children = content;
                }else{
                    children = [content];
                }


                var child,el;
                for(var i = 0 ; i < children.length; i++){
                    child = children[i];
                    if(child.render){
                        el = child.render();
                        var parentNode = this.$el.parentNode;
                        parentNode.insertBefore(el, this.$el);
                    }
                }
            }
        });
    }
);