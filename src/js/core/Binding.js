rAppid.defineClass("js.core.Binding", ["js.core.Component"], function(Component,Script) {
    return Component.inherit({
        _initializeChildren: function(childComponents){
            this.base._initializeChildren.callBase(this,childComponents);
        },
        _initializeAttributes: function(attributes){
            this.base._initializeAttributes.callBase(this);

            if(attributes.transform){
                this.transform = attributes.transform;
            }
            if(attributes.transformBack){
                this.transformBack = attributes.transformBack;
            }


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