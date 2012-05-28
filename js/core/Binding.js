define(["js/core/EventDispatcher", "js/core/BindingParser", "underscore"], function (EventDispatcher, Parser, _) {

    /**
     * Returns false if path includes function
     * @param path
     */
    var pathToString = function (path) {
        var str = [];
        for (var i = 0; i < path.length; i++) {
            var el = path[i];
            if (el.type == TYPE_VAR) {
                str.push(el.name);
            } else {
                return false;
            }
        }
        return str.join(".");
    };
    var Bindable;
    var Binding = EventDispatcher.inherit("js.core.Binding",
        /** @lends Binding */
        {
            defaults: {
                event: 'change',
                path: null,
                twoWay: false
            },

            ctor: function (attributes) {
                if(!Bindable){
                    try {
                        Bindable = requirejs('js/core/Bindable');
                    } catch(e) {
                        Bindable = null;
                    }
                }
                this.callBase();

                this.$ = attributes;
                _.defaults(this.$,this.defaults);

                this.initialize();
            },

            transform: function (val) {
                return val;
            },

            transformBack: function (val) {
                return val;
            },

            initialize: function () {
                this._checkAttributes();
                this.$parameters = [];
                this.$events = [];
                this.$subBinding = null;

                if (!this.$.rootScope) {
                    this.$.rootScope = this;
                }
                var scope = this.$.scope;
                if(_.isString(this.$.path)){
                    this.$.path = Parser.parse(this.$.path,'path');
                }
                // split up first key
                this.$.key = this.$.path[0];
                var self = this;

                if (this.$.key.type == TYPE_FNC) {
                    var fncName = this.$.key.name;
                    this.$parameters = this.$.key.parameter;

                    if (_.isFunction(scope[fncName])) {
                        var fnc = scope[fncName];
                        var events = [];
                        if (fnc._attributes && fnc._attributes.length > 0) {
                            this.$.scope.bind("change", this._changeCallback, this);
                            this.$events.push({eventType: "change", callback: this._changeCallback});
                        } else {
                            if (fnc._events) {
                                events = fnc._events;
                            } else {
                                events = [];
                            }

                            var event, path;
                            for (var i = 0; i < events.length; i++) {
                                event = events[i];
                                scope.bind(event, this._callback, this);
                                this.$events.push({eventType: event, callback: this._callback});
                            }
                        }

                        var cb = function () {
                            self.trigger();
                        };

                        var para;
                        for (var j = 0; j < this.$parameters.length; j++) {
                            para = this.$parameters[j];
                            if (_.isObject(para)) {
                                this.$parameters[j] = this.$.bindingCreator.create(para, this.$.target, cb);
                            }

                        }
                        this.$.fnc = fnc;
                        this.$.fnc.trigger = function () {
                            self.trigger();
                        };
                    }

                } else {
                    this.$.event = "change:" + this.$.key.name;
                    this.$events.push({eventType: this.$.event, callback: this._callback});
                    // on change of this key
                    scope.bind(this.$.event, this._callback, this);
                }

                if (this.$.twoWay === true && this.$.path.length === 1) {
                    this.$.targetEvent = 'change:' + this.$.targetKey;

                    this.$.target.bind(this.$.targetEvent, this._revCallback, this);
                }

                this._createSubBinding();
                scope.bind('destroy', function () {
                    self.destroy();
                });


                if (this.$.path.length === 1) {
                    this.trigger();
                }
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

                if(!this.$.bindingCreator){
                    this.$.bindingCreator = this;

                }
            },
            _createSubBinding: function () {
                if (this.$.path.length > 1) {
                    var nScope;
                    if (this.$.fnc) {
                        nScope = this.getValue();
                    } else {
                        nScope = this.$.scope.$[this.$.key.name];
                    }
                    // if keys are left and has value && is bindable
                    // get value for first child
                    if (nScope && (nScope instanceof Bindable)) {
                        // init new binding, which triggers this binding
                        this.$subBinding = new Binding({scope: nScope, path: this.$.path.slice(1), target: this.$.target, targetKey: this.$.targetKey, rootScope: this.$.rootScope, callback: this.$.callback, context: this.$.context, twoWay: this.$.twoWay, transform: this.$.transform, transformBack: this.$.transformBack, bindingCreator: this.$.bindingCreator});
                    }
                }
            },
            _revCallback: function (e) {
                if (this.$.fnc) {
                    var params = this._getFncParameters();
                    params.unshift(e.$);
                    this.$.fnc.apply(this.$.scope, params);
                } else {
                    this.$.scope.set(pathToString(this.$.path), this.transformBack(e.$));
                }
            },
            _changeCallback: function (event) {
                for (var i = 0; i < this.$.fnc._attributes.length; i++) {
                    if (!_.isUndefined(event.$[this.$.fnc._attributes[i]])) {
                        this.trigger();
                        return;
                    }
                }
            },
            _callback: function () {
                // remove subBindings!
                if (this.$subBinding) {
                    this.$subBinding.destroy();
                    this.$subBinding = null;
                }

                // try to create subBinding
                this._createSubBinding();

                this.trigger();
            },
            destroy: function () {
                var e;
                for (var j = 0; j < this.$events.length; j++) {
                    e = this.$events[j];
                    this.$.scope.unbind(e.eventType, e.callback);
                }

                if (this.$.twoWay === true) {
                    this.$.target.unbind(this.$.targetEvent, this._revCallback);
                }
                if (this.$subBinding) {
                    this.$subBinding.destroy();

                    delete this.$subBinding;
                }

                // destroy parameter bindings
                for (var i = 0; i < this.$parameters.length; i++) {
                    var par = this.$parameters[i];
                    if (par instanceof Binding) {
                        par.destroy();
                    }
                }
            },
            _getFncParameters: function () {
                var parameters = [];
                for (var i = 0; i < this.$parameters.length; i++) {
                    var para = this.$parameters[i];
                    if (para instanceof Binding) {
                        para = para.getValue();
                    }
                    parameters.push(para);
                }
                return parameters;
            },
            getValue: function () {
                if (this.$subBinding) {
                    return this.$subBinding.getValue();
                } else {
                    if (this.$.fnc) {
                        return this.$.fnc.apply(this.$.scope, this._getFncParameters());
                    } else if (this.$.path.length == 1) {
                        return this.$.scope.get(this.$.key.name);
                    } else {
                        return null;
                    }
                }
            },
            getContextValue: function () {
                if (this.$.context && this.$.context.length > 1) {
                    return Binding.contextToString(this.$.context);
                } else {
                    return this.getValue();
                }
            },
            // trigger
            trigger: function () {
                // get value
                var val = this.getContextValue();
                if (this.$.targetKey) {
                    this.$.target.set(this.$.targetKey, this.transform(val));
                } else if (this.$.callback) {
                    this.$.callback.call(this.$.target, this.transform(val));
                }

            },
            toString: function () {
                return this.getValue();
            },
            create: function(bindingDef, target, callback){
                var options = {scope: this.$.scope, target: target, callback: callback, path: bindingDef.path, twoWay : bindingDef.type === TYPE_TWOWAY, bindingCreator: this.$.bindingCreator};

                var fncEl;
                var fncScope;
                if(bindingDef.transform) {
                    fncEl = bindingDef.transform.pop();
                    fncScope = this.get(bindingDef.transform);
                    if(fncScope){
                        options.transform = fncScope[fncEl.name];
                    }
                }
                if(bindingDef.transformBack){
                    fncEl = bindingDef.transformBack.pop();
                    fncScope = this.get(bindingDef.transform);
                    if (fncScope) {
                        options.transformBack = fncScope[fncEl.name];
                    }
                }
                return new Binding(options);
            }
        });

    var TYPE_FNC = Binding.TYPE_FNC = "fnc";
    var TYPE_VAR = Binding.TYPE_VAR = "var";
    var TYPE_STATIC = Binding.TYPE_STATIC ="static";
    var TYPE_TWOWAY = Binding.TYPE_TWOWAY ="twoWay";

    Binding.contextToString = function (context) {
        var str = "", el;
        for (var i = 0; i < context.length; i++) {
            el = context[i];
            if (el instanceof Binding) {
                el = el.getValue();
            }
            if (el !== null && typeof(el) !== "undefined") {
                str += el;
            }
        }
        return str;
    };

    return Binding;
});