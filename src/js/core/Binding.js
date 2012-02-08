rAppid.defineClass("js.core.Binding", ["js.core.Component"], function(Component) {
    return Component.inherit({
        ctor: function(attributes){
            this.$callbacks = [];
            this.callBase();
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
        },
        // adds a callback to the model event
        add:function (fnc, target) {
            var cb = {
                fnc:this.createCallbackFnc(fnc, target),
                target:target
            }
            this.$.model.on(this.getEventName(), cb.fnc);

            this.$callbacks.push(cb);
        },
        createCallbackFnc:function (fnc, target) {
            var self = this;
            return function (model, value) {
                fnc.call(target, self.transform(value, model));
            }
        },
        getEventName:function () {
            if (this.$.key != null) {
                return this.$.event + ":" + this.$.key;
            } else {
                return this.$.event;
            }
        },
        // removes the callback
        remove:function (fnc) {
            var self = this;
            _.each(this.$callbacks, function (cb, i) {
                if (cb.fnc == fnc) {
                    self.$callbacks.slice(i, 1);
                }
            });
            this.$.model.unbind(this.getEventName(), fnc);
        },
        removeByTarget:function (target) {
            var self = this;
            var callback;
            _.each(this.$callbacks, function (cb, i) {
                if (cb.target == target) {
                    callback = cb;
                    self.$callbacks.slice(i, 1);
                }
            });
            this.$.model.unbind(this.getEventName(), callback.fnc);
        },
        getValue:function () {
            if (this.$.key != null) {
                if (this.$.event == "change") {
                    var val = this.$.model.$[this.$.key];
                    return this.transform(val, this.$.model);
                }
            }
            return this.transform(null, this.$.model);
        },
        setValue:function (v, silent) {
            if (_.isUndefined(silent)) {
                silent = true;
            }
            var s = {};
            s[this.$.key] = this.transformBack(v, this);
            this.$.model.set(s, {silent:silent});
        }
    });
});