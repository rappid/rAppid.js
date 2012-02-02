rAppid.defineClass("js.core.Binding", ["js.core.Component","js.html.script"], function(Component,Script) {
    return Component.inherit({
        _initializeChildren: function(childComponents){
            this.base._initializeChildren.callBase(this,childComponents);

            var obj, component;
            for(var i = 0; i < childComponents.length; i++){
                component = childComponents[i];
                if(component instanceof Script){
                    obj = component.evaluate();
                    break;
                }
            }
            if(obj.transform){
                this.transform = obj.transform;
            }
            if(obj.transformBack){
                this.transformBack = obj.transformBack;
            }
        },
        _initializeAttributes: function(attributes){

        },
        // default transform method
        transform: function(val,model){
            return val;
        },
        // default transform back for 2way binding
        transformBack: function(val,model){
            return val;
        }
    });
});