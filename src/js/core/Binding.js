rAppid.defineClass("js.core.Binding", ["js.core.Component"], function(Component,Script) {
    return Component.inherit({
        ctor: function(attributes){
            this.base.ctor.callBase(this,attributes);
            this._initializeAttributes(attributes);
        },
        _defaults: {
            event: 'change',
            key: null
        },
        _initializeChildren: function(childComponents){
            // this.base._initializeChildren.callBase(this,childComponents);
        },
        _initializeAttributes: function(attributes){
            this.base._initializeAttributes.callBase(this);

            if(attributes.transform){
                this.transform = attributes.transform;
            }
            if(attributes.transformBack){
                this.transformBack = attributes.transformBack;
            }

            if(!attributes.model){
                throw "No model defined for binding";
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