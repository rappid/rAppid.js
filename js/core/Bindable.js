define(["js/core/EventDispatcher", "js/lib/parser", "js/core/Binding", "underscore", "js/core/BindingCreator"],
    function (EventDispatcher, Parser, Binding, _, BindingCreator) {

        var bindingCreator,
            Bindable,
            EventBindable,
            RULE_PATH = {startRule: "path"},
            RULE_EVENT_HANDLER = {startRule: "eventHandler"};

        // global invalidation timer
        var globalInvalidationQueue = (function () {

            var id,
                callbacks = [],
                work = function () {
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
                addCallback: function (callback) {
                    callbacks.push(callback);

                    if (!id) {
                        id = setTimeout(work, 1000 / 60);
                    }
                }
            };
        })();

        var isDeepEqual = function (a, b) {
            if (a === b) {
                return true;
            }

            if (a instanceof Bindable && b instanceof Bindable) {
                return a.isDeepEqual(b);
            } else if (a instanceof Bindable || b instanceof Bindable) {
                return false;
            } else if (_.isArray(a) && _.isArray(b)) {
                if (a.length !== b.length) {
                    return false;
                }
                for (var i = 0; i < a.length; i++) {
                    if (!isDeepEqual(a[i], b[i])) {
                        return false;
                    }
                }
                return true;
            } else if (a instanceof Date && b instanceof Date) {
                return a.getTime() === b.getTime();
            } else if (_.isObject(a) && _.isObject(b)) {
                if (_.size(a) !== _.size(b)) {
                    return false;
                }
                for (var objectKey in a) {
                    if (a.hasOwnProperty(objectKey) && b.hasOwnProperty(objectKey)) {
                        if (!isDeepEqual(a[objectKey], b[objectKey])) {
                            return false;
                        }
                    }
                }
                return true;
            }

            return _.isEqual(a, b);
        };

        var isEqual = function (a, b) {
            if (a instanceof EventDispatcher || b instanceof EventDispatcher) {
                return a === b;
            }
            return _.isEqual(a, b);
        };


        Bindable = EventDispatcher.inherit("js.core.Bindable",
            {
                /***
                 * creates a new instance of Bindable, which can be bound to components
                 *
                 * @param {Object} [attributes] the default attributes which will be set during instantiation
                 * @param {Boolean} [evaluateBindingsInCtor] decides if bindings should be evaluated in ctor or not
                 */
                ctor: function (attributes, evaluateBindingsInCtor) {
                    bindingCreator = bindingCreator || new BindingCreator();

                    this.$eventBindables = [];
                    this.$bindings = {};
                    this.$bindingCreator = bindingCreator;

                    // call the base class constructor
                    this.callBase(null);

                    this.$ = {};
                    this.$injected = {};
                    this.$bindingAttributes = {};

                    this.$invalidatedProperties = {};
                    this.$invalidated = false;

                    _.extend(this._eventAttributes, this.base._eventAttributes || {});

                    attributes = attributes || {};

                    var defaultAttributes = this._defaultAttributes(),
                        defaultAttribute;

                    var nonBindings = {};

                    if (!evaluateBindingsInCtor) {
                        for (var k in attributes) {
                            if (attributes.hasOwnProperty(k)) {
                                if (_.isString(attributes[k])) {
                                    bindingDefinitions = bindingCreator.parse(attributes[k]);

                                    if (bindingCreator.containsBindingDefinition(bindingDefinitions)) {
                                        // we found an attribute containing a binding definition
                                        nonBindings[k] = true;
                                    }
                                }
                            }
                        }

                    }

                    for (var key in defaultAttributes) {
                        if (defaultAttributes.hasOwnProperty(key)) {
                            defaultAttribute = defaultAttributes[key];
                            if (!attributes.hasOwnProperty(key)) {
                                if (_.isFunction(defaultAttribute)) {
                                    // Function as default -> construct new Object
                                    attributes[key] = new (defaultAttribute)();
                                } else {
                                    // RegExp should not be cloned!
                                    if (defaultAttributes[key] instanceof RegExp) {
                                        attributes[key] = defaultAttribute;
                                    } else {
                                        attributes[key] = _.clone(defaultAttribute);
                                    }
                                }
                            }
                        }
                    }

                    this.$ = attributes;

                    var $ = this.$,
                        bindingAttributes = this.$bindingAttributes,
                        bindingDefinitions,
                        value;

                    // we need to find out all attributes which contains binding definitions and set
                    // the corresponding $[key] to null -> than evaluate the bindings
                    // this is because some function bindings belong on other binding values which are
                    // at the time of evaluation maybe unresolved and for example {foo.bar} instead of a value
                    for (key in $) {
                        if ($.hasOwnProperty(key) && !nonBindings.hasOwnProperty(key)) {
                            value = $[key];
                            bindingDefinitions = bindingCreator.parse(value);

                            if (bindingCreator.containsBindingDefinition(bindingDefinitions)) {
                                // we found an attribute containing a binding definition
                                bindingAttributes[key] = {
                                    bindingDefinitions: bindingDefinitions,
                                    value: value
                                };

                                $[key] = null;
                            }
                        }
                    }


                    this.$previousAttributes = {};

                    this._initializeFromCtor();
                },

                /**
                 * values to be injected
                 * @key {String} name of the variable added to the $ of the instance
                 * @value {Function|String}
                 */
                inject: {},

                /***
                 *
                 * invokes the `_initialize` method. This method is a hook function and is overwritten by js.core.Component
                 *
                 * @private
                 */
                _initializeFromCtor: function () {
                    // hook
                    this._initialize();
                },

                /***
                 * starts the initialization of the `Bindable` if it hasn't initialized yet.
                 *
                 * It calls the following methods:
                 *
                 *  * initialize();
                 *  * _initializeBindings();
                 *
                 * @private
                 */
                _initialize: function () {
                    if (this.$initialized) {
                        return;
                    }

                    this.$initializing = true;

                    this.initialize();

                    this._initializeBindings();
                },

                /***
                 * the initialize method is a hook function to add a custom logic during the initiation process.
                 */
                initialize: function () {
                },

                /***
                 *
                 * returns the chained object defining the required injections
                 *
                 * @returns {Object}
                 * @private
                 */
                _injectChain: function () {
                    return this._generateDefaultsChain("inject");
                },

                /***
                 * sets up the Bindable or Component. It will inject the required injections and
                 * also will bind the application wide `MessageBus` to all methods annotated with the
                 * `.bus()` method annotation
                 *
                 * For `Components` the setUp method is invoked automatically during the add of the Component.
                 * For non `Components`
                 *
                 *
                 * @private
                 * @see {js.core.MessageBus}
                 * @wiki // TODO: write an wiki article or link an existing one
                 */
                _setUp: function () {
                    this._inject();
                    this._bindBus();
                },

                /***
                 * tears down the Bindable or Component. It will remove the injected variables and
                 * also will unbind the annotated event handlers from the application wide `MessageBus`
                 *
                 * @private
                 * @see {js.core.MessageBus}
                 * @wiki // TODO:
                 */
                _tearDown: function () {
                    this._extract();
                    this._unbindBus();
                },

                _inject: function () {

                    var inject = this._injectChain();

                    if (_.keys(inject).length > 0) {
                        // we need to inject at least on item

                        // synchronous singleton instantiation of Injection,
                        // because if module requires injection, application also depends on
                        // Injection.js and class should be installed.
                        var injection = this.$stage.$injection;
                        if (injection) {
                            for (var name in inject) {
                                if (inject.hasOwnProperty(name)) {
                                    try {
                                        var instance = injection.getInstance(inject[name]);
                                        this.set(name, instance);
                                        this.$injected[name] = instance;
                                    } catch (e) {

                                        if (_.isString(e)) {
                                            e = new Error(e + " for key '" + name + "' in class '" + this.constructor.name + "'");
                                        }

                                        throw e;
                                    }
                                }
                            }
                        } else {
                            throw "injection not available in systemManager";
                        }

                    }

                    this._postConstruct();
                },


                _bindBus: function () {
                    var fn;
                    if (!this.factory.__busListeners) {
                        this.factory.__busListeners = [];
                        for (var f in this) {
                            fn = this[f];
                            if (fn instanceof Function && fn._busEvents) {
                                for (var i = 0; i < fn._busEvents.length; i++) {
                                    this.$stage.$bus.bind(fn._busEvents[i], fn, this);
                                }
                                this.factory.__busListeners.push(f);
                            }
                        }
                    } else if (!!this.factory.__busListeners.length) {
                        var j = 0,
                            busListeners = this.factory.__busListeners;
                        while (j < busListeners.length) {
                            fn = this[busListeners[j++]];
                            for (i = 0; i < fn._busEvents.length; i++) {
                                this.$stage.$bus.bind(fn._busEvents[i], fn, this);
                            }
                        }

                    }
                },

                _unbindBus: function () {
                    if (!this.factory.__busListeners) {
                        for (var f in this) {
                            var fn = this[f];
                            if (fn instanceof Function && fn._busEvents) {
                                for (var i = 0; i < fn._busEvents.length; i++) {
                                    this.$stage.$bus.unbind(fn._busEvents[i], fn, this);
                                }
                            }
                        }
                    } else if (!!this.factory.__busListeners.length) {
                        var j = 0,
                            busListeners = this.factory.__busListeners;
                        while (j < busListeners.length) {
                            fn = this[busListeners[j++]];
                            for (i = 0; i < fn._busEvents.length; i++) {
                                this.$stage.$bus.unbind(fn._busEvents[i], fn, this);
                            }
                        }

                    }

                },

                _extract: function () {
                    this._preDestroy();

                    var inject = this._injectChain();

                    if (_.keys(inject).length > 0) {
                        for (var name in inject) {
                            if (inject.hasOwnProperty(name)) {
                                this.$[name] = null;
                                delete this.$injected[name];
                            }
                        }
                    }

                },

                /***
                 * Initialize all Binding and Event attributes
                 */
                _initializeBindings: function () {
                    if (this.$initialized) {
                        return;
                    }

                    var $ = this.$,
                        bindingCreator = this.$bindingCreator,
                        bindingAttributes = this.$bindingAttributes,
                        bindingDefinitions,
                        bindingAttribute,
                        value,
                        key;

                    // FIXME: resolve dependencies between bindings and loop in the correct order
                    // e.g. view="{{product.view}}" needs product

                    // Resolve bindings and events
                    for (key in bindingAttributes) {
                        if (bindingAttributes.hasOwnProperty(key)) {
                            bindingAttribute = bindingAttributes[key];
                            if (bindingAttribute) {
                                value = bindingAttribute.value;
                                bindingDefinitions = bindingAttribute.bindingDefinitions;
                                $[key] = bindingCreator.evaluate(value, this, key, bindingDefinitions);
                            } else {
                                value = $[key];
                                bindingDefinitions = null;
                            }
                        }
                    }

                    if (this.$errorAttribute && this.$bindings[this.$errorAttribute]) {
                        var b = this.$bindings[this.$errorAttribute][0], errorBinding;
                        if (b.$.path.length > 1) {
                            var path = b.$.path.slice(), attrKey = path.pop().name;
                            path = path.concat(bindingCreator.parsePath("errors()." + attrKey));

                            errorBinding = bindingCreator.create({
                                type: 'oneWay',
                                path: path
                            }, this, "$error");
                            if (errorBinding) {
                                $['$error'] = errorBinding.getValue();
                            }
                        }
                    }

                    this._initializeBindingsBeforeComplete();

                    this._initializationComplete();
                },

                _initializeBindingsBeforeComplete: function () {
                    // hook
                },

                _initializationComplete: function () {

                    // call commitChangedAttributes for all attributes
                    this.set(this.$, {
                        force: true,
                        silent: false,
                        initial: true
                    });

                    this.$initialized = true;
                    this.$initializing = false;
                },

                _postConstruct: function () {
                    // hook: after the injection is completed
                },

                _preDestroy: function () {
                    // hook: before the object is teared down
                },

                getScopeForKey: function (key) {
                    // if value was found
                    if (this.$.hasOwnProperty(key)) {
                        return this;
                    } else if (this.$parentScope) {
                        if (this.$parentScope.$rootScope === this.$rootScope) {
                            return this.$parentScope.getScopeForKey(key);
                        } else if (this.$parentScope.$.hasOwnProperty(key)) {
                            return this.$parentScope;
                        }
                    } else {
                        return null;
                    }
                },

                getScopeForFncName: function (fncName) {
                    var fnc = this[fncName];
                    if (fnc instanceof Function) {
                        return this;
                    } else if (this.$parentScope) {
                        if (this.$parentScope.$rootScope === this.$rootScope) {
                            return this.$parentScope.getScopeForFncName(fncName);
                        } else if (this.$parentScope[fncName] instanceof Function) {
                            return this.$parentScope;
                        }
                    } else {
                        return null;
                    }
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
                sync: function () {
                    if (this._$source) {
                        var val, attributes = {}, unsetAttributes = {};
                        for (var key in this.$) {
                            if (this.$.hasOwnProperty(key)) {
                                val = this.$[key];
                                if (val instanceof Bindable && val.sync()) {
                                    attributes[key] = val._$source;
                                } else {
                                    attributes[key] = val;
                                }
                            }
                        }
                        // remove all attributes, which are not in clone
                        for (var sourceKey in this._$source.$) {
                            if (this._$source.$.hasOwnProperty(sourceKey)) {
                                if (!attributes.hasOwnProperty(sourceKey)) {
                                    unsetAttributes[sourceKey] = "";
                                }
                            }
                        }
                        this._$source.set(unsetAttributes, {unset: true});
                        this._$source.set(attributes);
                        return true;
                    } else {
                        return false;
                    }

                },
                /***
                 * This method returns a copy of the Object with all attributes on the $
                 *
                 * @param {Object} options
                 * @return {js.core.Bindable} a fresh copy of the Bindable
                 */
                clone: function (options) {
                    var ret = {};
                    options = options || {};

                    for (var key in this.$) {
                        if (this.$.hasOwnProperty(key)) {
                            if (options.exclude) {
                                if (options.exclude instanceof Array) {
                                    if (_.include(options.exclude, key)) {
                                        ret[key] = this.$[key];
                                        continue;
                                    }
                                }
                            }
                            if (this.$bindings.hasOwnProperty(key) && this.factory.prototype.defaults.hasOwnProperty(key)) {
                                ret[key] = this.factory.prototype.defaults[key];
                            } else {
                                ret[key] = this._cloneAttribute(this.$[key], key);
                            }

                        }
                    }
                    var b = new this.factory(ret, true);
                    b._$source = this;
                    b.$injected = this.$injected;
                    return b;
                },
                /**
                 * Returns a copy of the attribute. This method is a hook for further cloning options
                 * @param attribute
                 * @param key
                 * @private
                 */
                _cloneAttribute: function (attribute, key) {
                    if (this.inject && this.inject.hasOwnProperty(key)) {
                        return attribute;
                    } else if (attribute instanceof Bindable) {
                        return attribute.clone();
                    } else if (attribute && (attribute.clone instanceof Function)) {
                        return attribute.clone();
                    } else if (_.isArray(attribute)) {
                        var retArray = [];
                        for (var i = 0; i < attribute.length; i++) {
                            retArray.push(this._cloneAttribute(attribute[i]));
                        }
                        return retArray;
                    } else if (attribute instanceof Date) {
                        return new Date(attribute.getTime());
                    } else if (_.isObject(attribute)) {
                        var retObject = {};
                        for (var attrKey in attribute) {
                            if (attribute.hasOwnProperty(attrKey)) {
                                retObject[attrKey] = this._cloneAttribute(attribute[attrKey], attrKey);
                            }
                        }
                        return retObject;
                    } else {
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

                    this.factory.chainCache = this.factory.chainCache || {};

                    if (this.factory.chainCache[property]) {
                        return this.factory.chainCache[property];
                    }

                    var ret = this[property],
                        base = this.base;

                    while (base) {
                        var baseValue = base[property];
                        for (var key in baseValue) {
                            if (baseValue.hasOwnProperty(key)) {
                                if (_.isUndefined(ret[key])) {
                                    ret[key] = baseValue[key];
                                }
                            }
                        }

                        base = base.base;
                    }

                    // cache the chain
                    this.factory.chainCache[property] = ret;

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
                 * @return {js.core.Bindable} this
                 */
                set: function (key, value, options) {

                    if (_.isNumber(key)) {
                        key = String(key);
                    }

                    if (_.isString(key)) {
                        var attributes = {};
                        attributes[key] = value;
                    } else {
                        options = value;
                        attributes = key;
                    }

                    options = options || {silent: false, unset: false, force: false};

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
                                if (options.force || !isEqual(now[key], attributes[key])) {
                                    prev = options.initial ? null : now[key];
                                    this.$previousAttributes[key] = prev;
                                    now[key] = attributes[key];
                                    changedAttributes[key] = now[key];

                                    changedAttributesCount++;
                                }
                            }
                        }
                    }

                    var commitMethod;
                    if (changedAttributesCount) {
                        for (key in changedAttributes) {
                            if (changedAttributes.hasOwnProperty(key)) {
                                commitMethod = this['_commit' + key.charAt(0).toUpperCase() + key.substr(1)];

                                if (commitMethod instanceof Function) {
                                    // call method

                                    if (commitMethod.call(this, now[key], this.$previousAttributes[key], options) === false) {
                                        // false returned rollback
                                        changedAttributesCount--;
                                        now[key] = this.$previousAttributes[key];
                                    }
                                }
                            }
                        }

                        if (changedAttributesCount) {
                            this._commitChangedAttributes(changedAttributes, options);
                            if (!options.silent) {
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

                setLater: function (key, value) {

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

                _commitInvalidatedAttributes: function () {
                    this.set(this.$invalidatedProperties);
                    this.$invalidatedProperties = {};
                },

                /***
                 * evaluates a path to retrieve a value
                 *
                 * @param {Object} [scope=this] the scope where the path is evaluated
                 * @param {String} key or path
                 * @returns the value for the path or undefined
                 */
                get: function (scope, key) {
                    if (!key) {
                        key = scope;
                        scope = this;
                    }

                    if (!key) {
                        return null;
                    }

                    var path;

                    // if we have a path object
                    if (_.isArray(key)) {
                        path = key;
                        // path element
                    } else if (_.isObject(key)) {
                        path = [key];
                    } else {
                        path = Parser.parse(key, RULE_PATH);
                    }

                    var pathElement, val,
                        parameters, fnc,
                        newParameters;
                    for (var j = 0; j < path.length; j++) {
                        if (scope == null) {
                            return undefined;
                        } else {
                            pathElement = path[j];
                            if (pathElement.type == "fnc") {
                                fnc = scope[pathElement.name];
                                parameters = pathElement.parameter;
                                newParameters = [];
                                for (var i = 0; i < parameters.length; i++) {
                                    var param = parameters[i];

                                    if (_.isArray(param)) {
                                        param = this.get(param);
                                    } else if (_.isObject(param) && param.type && param.path) {
                                        param = this.get(param.path);
                                    }
                                    newParameters.push(param);
                                }
                                scope = fnc.apply(scope, newParameters);
                            } else if (pathElement.type == "var") {
                                if (scope instanceof Bindable) {
                                    if (path.length - 1 === j) {
                                        val = scope.$[pathElement.name];
                                        if (_.isUndefined(val)) {
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

                            if (scope && pathElement.index != null) {
                                // if it's an array
                                if (_.isArray(scope)) {
                                    scope = scope[pathElement.index];
                                    // if it's a list
                                } else if (scope.at) {
                                    scope = scope.at(pathElement.index);
                                }
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
                 * @param {Object} options - the options passed in the set method
                 * @abstract
                 * @private
                 */
                _commitChangedAttributes: function (attributes, options) {
                    // override
                },

                _hasAll: function (attributes, search) {

                    for (var i = 0; i < search.length; i++) {
                        if (!attributes.hasOwnProperty(search[i])) {
                            return false;
                        }
                    }

                    return true;
                },

                _hasSome: function (attributes, search) {

                    for (var i = 0; i < search.length; i++) {
                        if (attributes.hasOwnProperty(search[i])) {
                            return true;
                        }
                    }

                    return false;
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
                        // if we have a string with a function
                        if (_.isString(event) && event.indexOf("(") > 0) {
                            thisArg = callback;
                            var fncString = event;
                            event = path;
                            var parameters;
                            var eventBinding = Parser.parse(fncString, RULE_EVENT_HANDLER);
                            if (eventBinding.type === "fnc") {
                                parameters = eventBinding.parameter;
                            }
                            var scope = thisArg || this;
                            callback = scope[fncString.split("(").shift()];

                            this.callBase(event, new Bindable.EventHandler(callback, scope, parameters));
                        } else {
                            // else we have a chained event binding
                            if (_.isArray(path) && path.length > 0) {
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
                    }
                },

                /***
                 * Unbinds an bound event handler from an EventDispatcher.
                 *
                 * @param {String} [path] - the path from which the event should be unbound
                 * @param {String} event - the type of the event
                 * @param {Function} callback - the event handler which is currently bound
                 * @param {Object} [scope]
                 */
                unbind: function (path, event, callback, scope) {
                    if (event instanceof Function && _.isString(path)) {
                        this.callBase(path, event, callback);
                    } else {
                        var eb;
                        if (_.isArray(path) && path.length > 0) {
                            scope = callback;
                            callback = event;
                            event = path[1];
                            path = path[0];
                        }
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

                _innerDestroy: function () {
                    if (this.$eventBindables) {
                        var list = this.$eventBindables.slice();
                        for (var i = 0; i < list.length; i++) {
                            list[i].destroy();
                        }
                        this.$eventBindables = [];
                    }
                    this.callBase();
                },

                isDeepEqual: function (b, keys) {
                    if (!b) {
                        return false;
                    }
                    if (!keys && (_.size(this.$) - _.size(this.$injected)) !== (_.size(b.$) - _.size(b.$injected))) {
                        return false;
                    }
                    for (var key in this.$) {
                        if (keys && _.indexOf(keys, key) === -1) {
                            // key not needed to check
                            continue;
                        }

                        if (this.$injected.hasOwnProperty(key)) {
                            // don't compare injected keys
                            continue;
                        }

                        if (this.$.hasOwnProperty(key) && b.$.hasOwnProperty(key)) {
                            if (!isDeepEqual(this.$[key], b.$[key])) {
                                return false;
                            }
                        } else {
                            return false;
                        }
                    }
                    return true;
                },
                isEqual: function (b) {
                    return isEqual(this, b);
                }
            });

        EventBindable = Bindable.inherit({
            _commitChangedAttributes: function (attributes) {
                this.callBase();
                if (attributes.binding) {
                    this.set('value', attributes.binding.getValue());
                } else if (attributes.hasOwnProperty('value')) {
                    var value = attributes.value;
                    this._unbindEvent(this.$previousAttributes.value);
                    this._bindEvent(value);

                    if (this.$.binding) {
                        this.$.binding.triggerBinding();
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
            _innerDestroy: function () {
                this._unbindEvent(this.$.value);
                this.$.binding.destroy();
                this.callBase();
            }
        });

        Bindable.EventHandler = EventDispatcher.EventHandler.inherit({
            /**
             * @param {Function} callback The callback function
             * @param {Object} scope The callback scope
             */
            ctor: function (callback, scope, parameters) {
                this.callBase();
                this.parameters = parameters;
            },

            /**
             * @param {js.core.EventDispatcher.Event} event
             * @param {Object} caller
             */
            trigger: function (event, caller) {
                var args;
                if (this.parameters) {
                    var parameter,
                        first,
                        scope;

                    args = [];

                    for (var i = 0; i < this.parameters.length; i++) {
                        parameter = this.parameters[i];
                        if (_.isArray(parameter)) {
                            first = parameter[0];
                            if (first.name === "event") {
                                args.push(event);
                            } else {
                                if (first.type === "fnc") {
                                    scope = caller.getScopeForFncName(first.name);
                                } else if (first.type === "var") {
                                    scope = caller.getScopeForKey(first.name);
                                }
                                if (scope) {
                                    args.push(scope.get(parameter));
                                } else {
                                    throw new Error("Couldn't find scope for " + first.name);
                                }
                            }
                        } else {
                            args.push(parameter);
                        }
                    }
                } else {
                    args = [event];
                }
                this.$callback.apply(this.scope, args, caller);
                return !event.isPropagationStopped;
            }
        });

        return Bindable;

    });