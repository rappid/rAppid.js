rAppid.defineClass("js.ui.View",
    ["underscore", "js.core.UIComponent"], function (_, UIComponent) {
        return UIComponent.inherit({
            _defaults: {
                tagName: "div",
                items: []
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
            _renderClass: function(className){
                this.$el.setAttribute('class',className);
            }
        });
    }
);