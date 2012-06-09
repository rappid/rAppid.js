define(["require","js/core/Component"], function (require,Component) {
    return Component.inherit("js.core.Content", {
        getChildren: function(){
            var el, children = [];
            for(var i = 0; i < this.$elements.length; i++){
                el = this.$elements[i];
                if(el instanceof require("js/html/DomElement")){
                    children.push(el);
                }
            }
            return children;
        }
    });
});