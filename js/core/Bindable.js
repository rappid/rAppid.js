define(["js/core/EventDispatcher", "js/lib/parser", "js/core/Binding","underscore"],


    function (EventDispatcher, Parser, Binding, _) {
        // global invalidation timer
        var globalInvalidationQueue = (function() {

            var id,
                callbacks = [],
                work = function() {
                    for (var i = 0; i < callbacks.length; i++) {
                        try {
                            callbacks[i]();
                        } catch (e) {
                            (console.warn || console.log).call(console, e);
                        }
                    }

                    callbacks = [];
                    id = null;
                };

            return {
                addCallback: function(callback) {
                    callbacks.push(callback);

                    if (!id) {
                        id = setTimeout(work, 1000 / 60);
                    }
                }
            }
        })();

        var Bindable = EventDispatcher.inherit("js.core.Bindable",
            {
                /***
                 * creates a new instance of bindable, which can be bound to components
                 *
                 * @param {Object} [attributes] the default attributes which will be set during instantiation
                 */
                ctor: function (attributes) {
                    this.$eventBindables = [];

                    // call the base class constructor
                    this.callBase(null);

                    this.$ = {};
                    this.$invalidatedProperties = {};
                    this.$invalidated = false;

                    _.extend(this._eventAttributes, this.base._eventAttributes || {});

                    attributes = attributes || {};

                    var defaultAttributes = this._defaultAttributes();
                    for (var key in defaultAttributes) {
                        if (defaultAttributes.hasOwnProperty(key)) {
                            if (!attributes.hasOwnProperty(key)) {
                                if (_.isFunction(defaultAttributes[key])) {
                                    // Function as default -> construct new Object
                                    attributes[key] = new (defaultAttributes[key])();
                                } else {
                                    attributes[key] = _.clone(defaultAttributes[key]);
                                }
                            }
                        }
                    }

                    this.$ = attributes;
                    // TODO: clone and keep prototype for attribute the same -> write own clone method
                    this.$previousAttributes = _.clone(attributes);

                },
                /**
                 * Here you can define the default attributes of the instance.
                 *
                 * @static
                 */
                defaults: {
                },
                /**
                 * Writes attributes back to the source
                 */
                sync: function(){
                    if(this._$source) {
                        var val, attributes = {}, unsetAttributes = {};
                        for (var key in this.$) {
                            if (this.$.hasOwnProperty(key)) {
                                val = this.$[key];
                                if(val instanceof Bindable && val.sync()){
                                    attributes[key] = val._$source;
                                }else{
                                    attributes[key] = val;
                                }
                            }
                        }
                        // remove all attributes, which are not in clone
                        for (var sourceKey in this._$source.$){
                            if(this._$source.$.hasOwnProperty(sourceKey)){
                                if(!attributes.hasOwnProperty(sourceKey)){
                                    unsetAttributes[sourceKey] = "";
                                }
                            }
                        }
                        this._$source.set(unsetAttributes,{unset:true});
                        this._$source.set(attributes);
                        return true;
                    }else{
                        return false;
                    }

                },
                /***
                 * This method returns a copy of the Object
                 * @return js.core.Bindable a fresh copy of the Bindable
                 */
                clone: function () {
                    var ret = {};
                    for (var key in this.$) {
                        if (this.$.hasOwnProperty(key)) {
                            ret[key] = this._cloneAttribute(this.$[key], key);
                        }
                    }
                    var b = new Bindable(ret);
                    b._$source = this;
                    return b;
                },
                /**
                 * Returns a copy of the attribute. This method is a hook for further cloning options
                 * @param attribute
                 * @param key
                 * @private
                 */
                _cloneAttribute: function(attribute, key){
                    if(attribute instanceof Bindable){
                        return attribute.clone();
                    }else if(_.isArray(attribute)){
                        var retArray = [];
                        for(var i = 0; i < attribute.length; i++){
                            retArray.push(this._cloneAttribute(attribute[i]));
                        }
                        return retArray;
                    } else if(_.isObject(attribute)){
                        var retObject = {};
                        for (var attrKey in attribute){
                            if(attribute.hasOwnProperty(attrKey)){
                                retObject[attrKey] = this._cloneAttribute(attribute[attrKey], attrKey);
                            }
                        }
                        return retObject;
                    } else{
                        return attribute;
                    }
                },
                /***
                 *
                 * @return {Object} returns the default attributes and includes the defaults from base classes
                 * @private
                 */
                _defaultAttributes: function () {
                    return this._generateDefaultsChain("defaults");
                },

                /***
                 * generates a default chain containing the values from this instance and base classes
                 *
                 * @param {String} property - the name of the static property used to find defaults
                 * @return {*}
                 * @private
                 */
                _generateDefaultsChain: function (property) {
                    var ret = this[property],
                        base = this.base;

                    while (base) {
                        _.defaults(ret, base[property]);
                        base = base.base;
                    }

                    return ret;
                },

                /**
                 * Sets new values for attributes and notify about changes
                 *
                 * @param {String} key The attribute key
                 * @param {String} value The attribute value
                 * @param {Object} options A hash of options
                 * @param {Boolean} [options.silent=false] if true no event is triggered on change
                 * @param {Boolean} [options.unset=false] if true the attribute gets deleted
                 */
                set: function (key, value, options) {
                    var attributes = {};

                    if(_.isNumber(key)){
                        key = String(key);
                    }

                    if (_.isString(key)) {
                        attributes[key] = value;
                    } else {
                        options = value;
                        attributes = key;
                    }

                    options = options || {silent: false, unset: false};

                    // for un-setting attributes
                    if (options.unset) {
                        for (key in attributes) {
                            if (attributes.hasOwnProperty(key)) {
                                attributes[key] = void 0;
                            }
                        }
                    }

                    var changedAttributes = {},
                        changedAttributesCount = 0,
                        now = this.$,
                        val, prev;

                    for (key in attributes) {
                        if (attributes.hasOwnProperty(key)) {
                            // get the value
                            val = attributes[key];
                            // unset attribute or change it ...
                            if (options.unset === true) {
                                prev = now[key];
                                delete now[key];
                                changedAttributes[key] = undefined;
                                changedAttributesCount++;
                                this.$previousAttributes[key] = prev;
                            } else {
                                if (!_.isEqual(now[key], attributes[key])) {
                                    prev = now[key];
                                    this.$previousAttributes[key] = prev;
                                    now[key] = attributes[key];
                                    changedAttributes[key] = now[key];

                                    changedAttributesCount++;
                                }
                            }
                        }
                    }

                    if (changedAttributesCount) {
                        for (key in changedAttributes) {
                            if (changedAttributes.hasOwnProperty(key)) {
                                var commitMethodName = '_commit' + key.charAt(0).toUpperCase() + key.substr(1);

                                if (this[commitMethodName] instanceof Function) {
                                    // call method

                                    if (this[commitMethodName](now[key], this.$previousAttributes[key]) === false) {
                                        // false returned rollback
                                        changedAttributesCount--;
                                        now[key] = this.$previousAttributes[key];
                                    }
                                }
                            }
                        }

                        if (changedAttributesCount) {
                            this._commitChangedAttributes(changedAttributes);
                            if (options.silent === false) {
                                for (key in changedAttributes) {
                                    if (changedAttributes.hasOwnProperty(key)) {
                                        this.trigger('change:' + key, changedAttributes[key], this);
                                    }
                                }
                                this.trigger('change', changedAttributes, this);
                            }
                        }

                    }

                    return this;
                },

                setLater: function(key, value) {

                    if (_.isString(key)) {
                        key = {};
                        key[key] = value;
                    }

                    _.extend(this.$invalidatedProperties, key);

                    if (!this.$invalidated) {
                        this.$invalidated = true;
                        globalInvalidationQueue.addCallback(this._commitInvalidatedAttributes);
                    }

                },

                _commitInvalidatedAttributes: function() {
                    this.set(this.$invalidatedProperties);
                    this.$invalidatedProperties = {};
                },

                /***
                 * evaluates a path to retrieve a value
                 *
                 * @param {Object} [scope=this] the scope where the path is evaluated
                 * @param {String} key
                 * @returns the value for the path or undefined
                 */
                get: function(scope, key) {
                    if(!key){
                        key = scope;
                        scope = this;
                    }

                    if(!key) {
                        return null;
                    }

                    var path;

                    // if we have a path object
                    if(_.isArray(key)){
                        path = key;
                    // path element
                    }else if(_.isObject(key)){
                        path = [key];
                    }else{
                        path = Parser.parse(key, "path");
                    }

                    var pathElement, val;
                    for (var j = 0; scope && j < path.length; j++) {
                        pathElement = path[j];
                        if (pathElement.type == "fnc") {
                            var fnc = scope[pathElement.name];
                            var parameters = pathElement.parameter;
                            for (var i = 0; i < parameters.length; i++) {
                                var param = parameters[i];
                                if (_.isObject(param)) {
                                    param.type = "static";
                                    parameters[i] = this.get(param.path);
                                }
                            }
                            scope = fnc.apply(scope, parameters);
                        } else if (pathElement.type == "var") {
                            if (scope instanceof Bindable) {
                                if (path.length - 1 === j ) {
                                    val = scope.$[pathElement.name];
                                    if(_.isUndefined(val)){
                                        val = scope[pathElement.name];
                                    }
                                    scope = val;
                                } else {
                                    scope = scope.get(pathElement.name);
                                }

                            } else {
                                scope = scope[pathElement.name];
                            }
                        }

                        if (scope && pathElement.index !== '') {
                            // if it's an array
                            if (_.isArray(scope)) {
                                scope = scope[pathElement.index];
                                // if it's a list
                            } else if (scope.at) {
                                scope = scope.at(pathElement.index);
                            }
                        }
                    }
                    return scope;
                },

                /***
                 * determinate if a attribute is available
                 *
                 * @param {String} path - to get the value
                 * @returns {Boolean} true if attribute is not undefined
                 */
                has: function (path) {
                    return !_.isUndefined(this.get(path));
                },

                /***
                 * called after attributes has set and some of the has been changed
                 *
                 * @param {Object} attributes - contains the changed attributes
                 *
                 * @abstract
                 * @private
                 */
                _commitChangedAttributes: function (attributes) {
                    // override
                },

                /***
                 * Unset attribute on $
                 * @param {String|Object} key - the attribute or attributes to unset
                 * @param {Object} [options]
                 * @return {this}
                 */
                unset: function (key, options) {
                    (options || (options = {})).unset = true;
                    return this.set(key, null, options);
                },

                /***
                 * Clears all attributes
                 * @return {this}
                 */
                clear: function () {
                    return this.set(this.$, {unset: true});
                },

                /***
                 * Binds an event handler function to an EventDispatcher
                 *
                 * @param {String} path - a binding path e.g. a.b.c
                 * @param {String} event - the type of the event which should be bound
                 * @param {Function} callback - the event handler function
                 * @param {Object} [thisArg] - the thisArg used for calling the event handler
                 */
                bind: function (path, event, callback, thisArg) {
                    if (event instanceof Function && _.isString(path)) {
                        this.callBase(path, event, callback);
                    } else {
                        if(_.isArray(path) && path.length > 0){
                            thisArg = callback;
                            callback = event;
                            event = path[1];
                            path = path[0];
                        }
                        var eb = new EventBindable({
                            path: path,
                            event: event,
                            scope: thisArg,
                            callback: callback,
                            value: null
                        });
                        eb.set('binding', new Binding({path: path, scope: this, target: eb, targetKey: 'value'}));
                        this.$eventBindables.push(eb);
                    }
                },

                /***
                 * Unbinds an bound event handler from an EventDispatcher.
                 *
                 * @param {String} [path] - the path from which the event should be unbound
                 * @param {String} event - the type of the event
                 * @param {Function} callback - the event handler which is currently bound
                 * TODO: why a scope is passed here?
                 * @param {Object} [scope]
                 */
                unbind: function (path, event, callback, scope) {
                    if (event instanceof Function) {
                        this.callBase(path, event, callback);
                    } else {
                        var eb;
                        for (var i = this.$eventBindables.length - 1; i >= 0; i--) {
                            eb = this.$eventBindables[i];
                            if (eb.$.scope === scope && eb.$.path === path && eb.$.event === event && eb.$.callback === callback) {
                                // unbind
                                eb.destroy();
                                this.$eventBindables.slice(i, 1);
                            }
                        }
                    }
                },

                /***
                 * Destroys all event bindings and triggers a destroy event
                 * @return {this}
                 */
                destroy: function() {
                    this.callBase();
                    for(var i = 0; i < this.$eventBindables.length; i++){
                        this.$eventBindables[i].destroy();
                    }

                    this.trigger('destroy',this);
                    return this;
                }
            });

        var EventBindable = Bindable.inherit({
            _commitChangedAttributes: function(attributes){
                this.callBase();
                if(attributes.binding){
                    this.set('value', attributes.binding.getValue());
                }else if(attributes.value){
                    var value = attributes.value;
                    this._unbindEvent(this.$previousAttributes['value']);
                    if (!_.isUndefined(value)) {
                        this._bindEvent(value);
                    }
                }

            },
            _unbindEvent: function (value) {
                if (value && value instanceof EventDispatcher) {
                    value.unbind(this.$.event, this.$.callback, this.$.scope);
                }
            },
            _bindEvent: function (value) {
                if (value && value instanceof EventDispatcher) {
                    value.bind(this.$.event, this.$.callback, this.$.scope);
                }
            },
            destroy: function () {
                this._unbindEvent(this.$.value);
                this.$.binding.destroy();

                this.callBase();
            }
        });

        return Bindable;

    });