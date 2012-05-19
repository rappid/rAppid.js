define(["js/core/Bindable", "js/core/EventDispatcher", "js/core/BindingParser", "underscore"], function (Bindable, EventDispatcher, Parser, _) {
    var TYPE_FNC = "fnc";
    var TYPE_VAR = "var";
    var TYPE_STATIC = "static";

    var contextToString = function (context) {
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

    var Binding = Bindable.inherit("js.core.Binding",
        /** @lends Binding */
        {
            defaults: {
                event: 'change',
                path: null,
                twoWay: false
            },

            ctor: function () {
                this.callBase();

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

                            for (var i = 0; i < events.length; i++) {
                                var event = events[i];
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
                                this.$parameters[j] = Binding.create(para, this.$.target, cb);
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
                        this.$subBinding = new Binding({scope: nScope, path: this.$.path.slice(1), target: this.$.target, targetKey: this.$.targetKey, rootScope: this.$.rootScope, callback: this.$.callback, context: this.$.context, twoWay: this.$.twoWay, transform: this.$.transform, transformBack: this.$.transformBack});
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
                    return contextToString(this.$.context);
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
            }
        });

    function findTransformFunction(path, scope) {
        var pathElement = path[0];
        if (pathElement.type == TYPE_FNC) {
            scope = scope.getScopeForFncName(pathElement.name);
        } else {
            scope = scope.getScopeForKey(pathElement.name);
        }

        var nScope = scope;
        while (nScope && path.length > 0) {
            pathElement = path.shift();
            if (pathElement.type == TYPE_FNC) {
                return nScope[pathElement.name];
            } else if (pathElement.type == TYPE_VAR) {
                nScope = nScope.get(pathElement.name);
            }
        }

        return false;
    }

    Binding.create = function (bindingDef, targetScope, attrKey, context) {
        var path = bindingDef.path;
        var pathElement = path[0];

        var scope;
        var searchScope = targetScope;
        if (pathElement.type != TYPE_FNC && attrKey == pathElement.name) {
            searchScope = searchScope.$parentScope;
        }

        if (pathElement.type == TYPE_FNC) {
            scope = searchScope.getScopeForFncName(pathElement.name);
        } else {
            scope = searchScope.getScopeForKey(pathElement.name);
        }

        if (bindingDef.type == TYPE_STATIC) {
            var nScope = scope;
            while (nScope && path.length > 0) {
                pathElement = path.shift();
                if (pathElement.type == TYPE_FNC) {
                    var fnc = nScope[pathElement.name];
                    var parameters = pathElement.parameter;
                    for (var i = 0; i < parameters.length; i++) {
                        var param = parameters[i];
                        if (_.isObject(param)) {
                            param.type = TYPE_STATIC;
                            var binding = Binding.create(param, targetScope, "", context);
                            if (binding instanceof Binding) {
                                parameters[i] = binding.getValue();
                            } else {
                                parameters[i] = binding;
                            }

                        }
                    }
                    nScope = fnc.apply(nScope, parameters);
                } else if (pathElement.type == TYPE_VAR) {
                    if (nScope instanceof Bindable) {
                        nScope = nScope.get(pathElement.name);
                    } else {
                        nScope = nScope[pathElement.name];
                    }

                }
            }
            return nScope;
        } else {

            var cb;
            if (_.isFunction(attrKey)) {
                cb = attrKey;
            }


            if (scope) {
                var twoWay = (bindingDef.type == "twoWay");


                var options = {scope: scope, path: path, target: targetScope, twoWay: twoWay, context: context};

                if (twoWay) {
                    if (bindingDef.transform) {
                        var transformFnc = findTransformFunction(bindingDef.transform, searchScope);
                        if (transformFnc) {
                            options.transform = transformFnc;
                        }
                    }

                    if (bindingDef.transformBack) {
                        var transformBackFnc = findTransformFunction(bindingDef.transformBack, searchScope);
                        if (transformBackFnc) {
                            options.transformBack = transformBackFnc;
                        }
                    }
                }

                if (cb) {
                    options['callback'] = cb;
                } else {
                    options['targetKey'] = attrKey;
                }
                return new Binding(options);
            }

        }
    };

    Binding.evaluateText = function (text, scope, attrKey) {
        if (!_.isString(text)) {
            return text;
        }
        var bindingDefs = Parser.parse(text, "text"), binding, bindings = [], containsText = false;
        for (var i = 0; i < bindingDefs.length; i++) {
            var bindingDef = bindingDefs[i];
            if (bindingDef.length) {
                bindingDefs[i] = bindingDef;
            } else {
                binding = Binding.create(bindingDef, scope, attrKey, bindingDefs);
                if (binding instanceof Binding) {
                    bindings.push(binding);
                }
                bindingDefs[i] = binding;
            }

        }

        if (bindings.length > 0) {
            return bindings[0].getContextValue();
        } else if (bindingDefs.length > 0) {
            if (bindingDefs.length === 1) {
                return bindingDefs[0];
            }
            return contextToString(bindingDefs);
        } else {
            return text;
        }
    };

    return Binding;
});