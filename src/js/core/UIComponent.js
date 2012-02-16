rAppid.defineClass("js.core.UIComponent",
    ["underscore", "js.html.DomElement"], function (_, DomElement) {
        return DomElement.inherit({
            _defaults: {
                tagName: "div"
            },
            _commitChangedAttributes: function(attributes){
                if(this.isRendered()){
                    this._renderAttributes(attributes);
                }
            },
            _renderAttribute:function (key, attribute) {
                // generic call of render functions
                key = key[0].toUpperCase() + key.substr(1);
                var methodName = "_render" + key;
                var method = this[methodName];
                if (_.isFunction(method)) {
                    method.call(this, attribute);
                }
            },
            _initializationComplete: function(){
                this.callBase();
            }
        });
    }
);