rAppid.defineClass("js.core.UIComponent",
    ["underscore", "js.html.DomElement"], function (_, DomElement) {
        return DomElement.inherit({
            _defaults: {
                tagName: "div"
            },
            _renderAttribute:function (key, attr) {

            },
            _commitChangedAttributes: function(attributes){
                if(this.isRendered()){
                    for(var key in attributes){
                        if(attributes.hasOwnProperty(key)){
                            this._renderAttribute(attributes[key])
                        }
                    }
                }
            },
            _initializationComplete: function(){
                this.callBase();
            }
        });
    }
);