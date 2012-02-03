rAppid.defineClass("js.core.UIComponent",
    ["underscore", "js.html.DomElement"], function (_, DomElement) {
        return DomElement.inherit({
            _defaults: {
                tagName: "div"
            },
            _renderWidth: function(width){
                if(width){
                    this.$el.setAttribute('width',width);
                }else{
                    this.$el.removeAttribute('width');
                }
            },
            _renderClassName: function(className){
                if(className){
                    this.$el.setAttribute('className',className);
                }else{
                    this.$el.removeAttribute('className');
                }
            },
            _renderAttributes: function(attributes){

            }
        });
    }
);