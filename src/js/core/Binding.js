var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {

    rAppid.defineClass("js.core.Binding", ["js.core.Bindable"], function (Bindable) {
        var Binding = Bindable.inherit({
            defaults: {
                event: 'change',
                path: null,
                twoWay: false,
                transform: function (val) {
                    return val;
                },
                transformBack: function (val) {
                    return val;
                }
            },
            ctor: function () {
                this.callBase();

                this.initialize();
            },
            initialize: function () {
                this._checkAttributes();
                this.$subBinding = null;

                if (!this.$.rootScope) {
                    this.$.rootScope = this;
                }

                var keys = this.$.path.split(".");
                // split up first key
                this.$.key = keys.shift();
                this.$.event = "change:" + this.$.key;
                var scope = this.$.scope;

                // on change of this key
                scope.on(this.$.event, this._callback, this);

                if (this.$.twoWay === true) {
                    this.$.targetEvent = 'change:' + this.$.targetKey;
                    this.$.target.on(this.$.targetEvent, this._revCallback, this);
                }


                this._createSubBinding();
            },
            _checkAttributes: function () {
                // check infrastructur
                if (!this.$.path) {
                    throw "No path defined!";
                }

                if (!this.$.scope) {
                    throw "No scope defined!"
                }

                if (this.$.twoWay) {
                    if (!this.$.target) {
                        throw "TwoWay binding, but no target defined!";
                    }
                    if (!this.$.target instanceof Bindable) {
                        throw "Target is not a Bindable!";
                    }

                    if (!this.$.targetKey) {
                        throw "TwoWay binding, but no target key defined!";
                    }

                }
            },
            _createSubBinding: function () {
                var keys = this.$.path.split(".");
                var k = keys.shift();
                // if keys are left and has value && is bindable
                if (keys.length > 0) {
                    // get value for first child
                    var nScope = this.$.scope.$[k];
                    if (nScope && nScope instanceof Bindable) {
                        // init new binding, which triggers this binding
                        this.$subBinding = new Binding({scope: nScope, path: keys.join("."), target: this.$.target, targetKey: this.$.targetKey, rootScope: this.$.rootScope});
                    }
                }
            },
            _revCallback: function (e) {
                this.$.scope.set(this.$.path, this.$.transformBack(e.$, this.$.target));
            },
            _callback: function () {
                // remove subBindings!
                if (this.$subBinding) {
                    this.$subBinding.destroy();
                }

                // try to create subBinding
                this._createSubBinding();

                // get value
                var val = this.$.scope.get(this.$.path);

                // trigger
                this.$.target.set(this.$.targetKey, this.$.transform(val, this.$.rootScope));
            },
            destroy: function () {
                this.$.scope.unbind(this.$.event, this._callback);
                if (this.$.twoWay === true) {
                    this.$.target.unbind(this.$.targetEvent, this._revCallback);
                }
                if (this.$subBinding) {
                    this.$subBinding.destroy();
                }
            }
        });
        return Binding;
    });
});