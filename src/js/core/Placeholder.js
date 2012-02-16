rAppid.defineClass("js.core.Placeholder",
    ["underscore", "js.core.UIComponent"], function (_, UIComponent) {
        return UIComponent.inherit({
            defaults: {

            },
            render: function(){
                if(this.isRendered()){
                    return this.$el;
                }



                if(this.$.content){
                    this.$el = this.$.content.render();
                }else{
                    this.$textNode = document.createTextNode("");
                    this.$el = this.$textNode;
                }

                return this.$el;
            },
            clear: function(){
                this.set({content: this.$textNode});
            },
            _renderContent: function(content){
                var el = content.render();
                var parentNode = this.$el.parentNode;
                parentNode.replaceChild(el, this.$el);
                /*
                for(var i = 0 ; i < parentNode.childNodes.length; i++){
                    if(parentNode.childNodes[i] == this.$el){
                        parentNode.childNodes[i] = el;
                    }
                } */
                this.$el = el;
            }
        });
    }
);