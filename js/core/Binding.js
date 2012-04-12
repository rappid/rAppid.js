var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {

    rAppid.defineClass("js.core.Binding", ["js.core.Bindable", "js.core.EventDispatcher"], function (Bindable, EventDispatcher) {
        var splitPathOutSide = function (path, del, left, right) {
            var counter = 0, matches = [], c, last = 0;
            for (var i = 0; i < path.length - 1; i++) {
                c = path.charAt(i);
                if (c == left) counter++;
                if (c == right) counter--;

                if (counter === 0 && del == c) {
                    matches.push(path.substring(last, i));
                    last = i + 1;
                }
            }
            if (last > 0) {
                matches.push(path.substr(last));
            } else {
                return [path];
            }
            return matches;

        };
        var splitFirst = function (path) {
            return splitPathOutSide(path, ".", "(", ")")[0];
        };

        var Binding = Bindable.inherit(
            /** @lends Binding */
            {
                defaults:{
                    event:'change',
                    path:null,
                    twoWay:false,
                    transform:function (val) {
                        return val;
                    },
                    transformBack:function (val) {
                        return val;
                    }
                },

                ctor:function () {
                    this.callBase();

                    this.initialize();
                },
                initialize:function () {
                    this._checkAttributes();
                    this.$parameters = [];
                    this.$subBinding = null;

                    if (!this.$.rootScope) {
                        this.$.rootScope = this;
                    }
                    var scope = this.$.scope;
                    var keys = splitPathOutSide(this.$.path, ".", "(", ")");
                    // split up first key
                    this.$.key = keys.shift();

                    if (Binding.isFunctionDefinition(this.$.key)) {
                        var matches = this.$.key.match($fncRegex);
                        var fncName = matches[1];
                        var fncParameterStr = matches[2];

                        if (rAppid._.isFunction(scope[fncName])) {
                            var fnc = scope[fncName];
                            var events = [];
                            if (fnc._events) {
                                events = fnc._events;
                            } else {
                                events = ['change'];
                            }

                            for (var i = 0; i < events.length; i++) {
                                var event = events[i];
                                scope.bind(event, this._callback, this);
                            }
                            var self = this;
                            var cb = function () {
                                self.trigger();
                            };

                            // TODO: implement regex for , splitting
                            this.$parameters = splitPathOutSide(fncParameterStr, ",", "(", ")");
                            var para;
                            for (var j = 0; j < this.$parameters.length; j++) {
                                para = this.$parameters[j];
                                if (Binding.matches(para)) {
                                    this.$parameters[j] = Binding.create(para, this.$.target, cb);

                                }

                            }
                            this.$.fnc = fnc;
                        }

                    } else {
                        this.$.event = "change:" + this.$.key;

                        // on change of this key
                        scope.bind(this.$.event, this._callback, this);

                        if (this.$.twoWay === true) {
                            this.$.targetEvent = 'change:' + this.$.targetKey;
                            this.$.target.bind(this.$.targetEvent, this._revCallback, this);
                        }
                    }
                    this._createSubBinding();
                },
                _checkAttributes:function () {
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
                _createSubBinding:function () {
                    var keys = splitPathOutSide(this.$.path, ".", "(", ")");
                    var k = keys.shift();
                    if (keys.length > 0) {
                        var nScope;
                        if (this.$.fnc) {
                            nScope = this.getValue();
                        } else {
                            nScope = this.$.scope.$[k];
                        }
                        // if keys are left and has value && is bindable
                        // get value for first child
                        if (nScope && (nScope instanceof EventDispatcher)) {
                            // init new binding, which triggers this binding
                            this.$subBinding = new Binding({scope:nScope, path:keys.join("."), target:this.$.target, targetKey:this.$.targetKey, rootScope:this.$.rootScope, callback:this.$.callback});
                        }
                    }
                },
                _revCallback:function (e) {
                    this.$.scope.set(this.$.path, this.$.transformBack(e.$, this.$.target));
                },
                _callback:function () {
                    // remove subBindings!
                    if (this.$subBinding) {
                        this.$subBinding.destroy();
                        this.$subBinding = null;
                    }

                    // try to create subBinding
                    this._createSubBinding();

                    this.trigger();
                },
                destroy:function () {
                    this.$.scope.unbind(this.$.event, this._callback);
                    if (this.$.twoWay === true) {
                        this.$.target.unbind(this.$.targetEvent, this._revCallback);
                    }
                    if (this.$subBinding) {
                        this.$subBinding.destroy();
                    }

                    // destroy parameter bindings
                    for (var i = 0; i < this.$parameters.length; i++) {
                        var par = this.$parameters[i];
                        if (par instanceof Binding) {
                            par.destroy();
                        }
                    }
                },
                getValue:function () {
                    if (this.$subBinding) {
                        return this.$subBinding.getValue();
                    } else {
                        if (this.$.fnc) {
                            var parameters = [];
                            for (var i = 0; i < this.$parameters.length; i++) {
                                var para = this.$parameters[i];
                                if (para instanceof Binding) {
                                    para = para.getValue();
                                }
                                parameters.push(para);
                            }
                            return this.$.fnc.apply(this.$.scope, parameters);
                        } else if (this.$.path == this.$.key) {
                            return this.$.scope.get(this.$.key);
                        } else {
                            return null;
                        }
                    }
                },
                // trigger
                trigger:function () {
                    // get value
                    var val = this.getValue();
                    if (this.$.targetKey) {
                        this.$.target.set(this.$.targetKey, this.$.transform(val, this.$.rootScope));
                    } else if (this.$.callback) {
                        this.$.callback.call(this.$.target, this.$.transform(val, this.$.rootScope));
                    }

                }
            });

        var $bindingRegex = /^((?:\{{2}(.+)\}{2})|(?:\{(.+)\}))$/i;
        // var $twoWayBindingRegex= /^\{{2}([a-z_$\}][\(\)a-z0-9$\-_.,\{]*)\}{2}$/i;
        var $fncRegex = /^([a-z$_]\w*)\((.*)\)$/i;
        // var $fncNameRegex = /^(\w+)\(.*\)$/;

        Binding.matches = function (attrValue) {
            return $bindingRegex.test(attrValue);
        };

        Binding.create = function (bindingDef, targetScope, attrKey) {
            var cb;
            if (rAppid._.isFunction(attrKey)) {
                cb = attrKey;
            }

            var path = Binding.extractPath(bindingDef);
            var scopeKey = splitFirst(path);

            var scope;
            if (Binding.isFunctionDefinition(scopeKey)) {
                scope = targetScope.getScopeForFncName(scopeKey.substring(0, scopeKey.indexOf("(")));
            } else {
                scope = targetScope.getScopeForKey(scopeKey);

            }

            if(scope === targetScope && attrKey == scopeKey){
                scope = scope.$parentScope;
            }

            if (scope && (scope !== targetScope)) {
                var twoWay = bindingDef.indexOf("{{") == 0;
                var options = {scope:scope, path:path, target:targetScope, twoWay:twoWay};
                if (cb) {
                    options['callback'] = cb;
                } else {
                    options['targetKey'] = attrKey;
                }
                return new Binding(options);
            }

            return null;
        };

        Binding.extractPath = function (str) {
            var i = 0;
            while (str.charAt(i) == "{") {
                i++;
            }
            return str.substring(i, str.length - i);
        };

        Binding.matches = function (str) {
            return Binding.findBindingDefinitions(str).length === 1;
        };

        Binding.isFunctionDefinition = function (str) {
            return findMatchesIn(str, "(", ")", 0).length > 0;
        };

        Binding.findBindingDefinitions = function (str) {
            return findMatchesIn(str, "{", "}", 0);
        };

        var findMatchesIn = function (str, left, right, depth) {
            if (!rAppid._.isString(str)) return [];
            var c, stack = [], content, ret = [], r;
            for (var i = 0; i < str.length; i++) {
                c = str.charAt(i);
                if (c == left) {
                    stack.push(i);
                } else if (c == right) {
                    r = stack.pop();
                    if (stack.length == depth) {
                        content = str.substring(r, i + 1);
                        ret.push(content);
                    }
                }
            }
            return ret;
        };

        return Binding;
    });
});