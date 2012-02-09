rAppid.defineClass("js.ui.View",
    ["underscore", "js.core.UIComponent", "js.core.Template"], function (_, UIComponent, Template) {
        return UIComponent.inherit({
            _defaults: {
                tagName: "div",
                items: []
            },
            render: function(){
                if(this.isRendered()){
                   return this.$el;
                }
                console.log(this);
                var template = this.getTemplate('button-tpl');
                if(template){
                    console.log(template);
                }else{
                    return this.callBase();
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
            _renderClass: function(className){
                this.$el.setAttribute('class',className);
            }
        });
    }
);