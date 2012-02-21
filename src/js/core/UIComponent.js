rAppid.defineClass("js.core.UIComponent",
    ["underscore", "js.html.DomElement"], function (_, DomElement) {
        return DomElement.inherit({
            defaults: {
                tagName: "div"
            },
            _commitChangedAttributes: function(attributes){
                if(this.isRendered()){
                    this._renderAttributes(attributes);
                }
            },
            _initializationComplete: function(){
                this.callBase();
            }
        });
    }
);