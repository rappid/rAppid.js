define(['js/core/EventDispatcher','js/lib/parser','js/core/Binding', 'underscore'], function(EventDispatcher,Parser, Binding, _){

    function findTransformFunction(path, scope) {
        var pathElement = path[0];
        if (pathElement.type == Binding.TYPE_FNC) {
            scope = scope.getScopeForFncName(pathElement.name);
        } else {
            scope = scope.getScopeForKey(pathElement.name);
        }

        var nScope = scope;
        while (nScope && path.length > 0) {
            pathElement = path.shift();
            if (pathElement.type == Binding.TYPE_FNC) {
                return nScope[pathElement.name];
            } else if (pathElement.type == Binding.TYPE_VAR) {
                nScope = nScope.get(pathElement.name);
            }
        }

        return false;
    }

    return EventDispatcher.inherit('js.core.BindingCreator',{

        create: function(bindingDef, targetScope, attrKey, context){
            var path = bindingDef.path;
            var pathElement = path[0];

            var scope;
            var searchScope = targetScope;
            if (pathElement.type != Binding.TYPE_FNC && attrKey == pathElement.name) {
                searchScope = searchScope.$parentScope;
            }

            if (pathElement.type == Binding.TYPE_FNC) {
                scope = searchScope.getScopeForFncName(pathElement.name);
            } else {
                scope = searchScope.getScopeForKey(pathElement.name);
            }

            if(scope){
                if (bindingDef.type !== "static") {
                    var cb;
                    if (_.isFunction(attrKey)) {
                        cb = attrKey;
                    }

                    var twoWay = (bindingDef.type == Binding.TYPE_TWOWAY);


                    var options = {scope: scope, path: path, target: targetScope, twoWay: twoWay, context: context, bindingCreator: this};

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

                } else {
                    return scope.get(bindingDef.path);
                }
            }else{
                throw "Couldn't find scope for " + pathElement.name;
            }

        },

        evaluate: function (text, scope, attrKey) {
            if (!_.isString(text)) {
                return text;
            }
            var bindingDefs = Parser.parse(text, "text"), binding, bindings = [];
            for (var i = 0; i < bindingDefs.length; i++) {
                var bindingDef = bindingDefs[i];
                if (bindingDef.length) {
                    bindingDefs[i] = bindingDef;
                } else {
                    binding = this.create(bindingDef, scope, attrKey, bindingDefs);
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
                return Binding.contextToString(bindingDefs);
            } else {
                return text;
            }

        }
    });

});