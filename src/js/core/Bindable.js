var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {

    rAppid.defineClass("js.core.Bindable", ["js.core.EventDispatcher", "underscore"],
        /**
         * @export js.core.Bindable
         */
            function (EventDispatcher, _) {

            Function.prototype.on = function () {
                this._bindings = arguments;
                return this;
            };
            /**
             * @class js.core.Bindable
             * @extends js.core.EventDispatcher
             */

            var Bindable = EventDispatcher.inherit({
                ctor: function (attributes) {
                    // call the base class constructor
                    this.callBase(null);

                    this.$ = {};

                    _.extend(this._eventAttributes, this.base._eventAttributes || {});

                    attributes = attributes || {};

                    _.defaults(attributes, this._defaultAttributes());

                    this.$ = attributes;
                    this.$previousAttributes = _.clone(this.$);


                    var self = this, fnc;

                    var bind = function(key, targetKey, method){
                        self.on('change:' + key, function () {
                            self.set(targetKey, method.call(self));
                        });
                    };

                    // init calculated attributes
                    for (var key in this) {

                        // find functions which have a bindings attribute
                        if (_.isFunction(this[key]) && this[key]._bindings) {
                            fnc = this[key];
                            // register as listener to all bindings
                            for (var i = 0; i < fnc._bindings.length; i++) {
                                bind(fnc._bindings[i],key, fnc);
                            }
                            // set the return value of the function as attribute
                            this.set(key,fnc.call(this));
                        }
                    }
                },

                defaults: {
                },

                _defaultAttributes: function () {
                    return this._generateDefaultsChain("defaults");
                },

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
                 * an array of attributes names, which will expect handler functions
                 */
                _eventAttributes: {},

                _isEventAttribute: function (attributeName) {
                    return attributeName.indexOf("on") == 0;
                    // return this._eventAttributes.hasOwnProperty(attributeName);
                },

                _getEventTypeForAttribute: function (eventName) {
                    // TODO: implement eventAttribites as hash
                    return this._eventAttributes[eventName];
                },

                /**
                 *
                 * @param key
                 * @param value
                 * @param options
                 */
                set: function (key, value, options) {
                    var attributes = {};

                    if (_.isString(key)) {
                        // check for path
                        var path = key.split(".");
                        if (path.length > 1) {
                            var scope = this.get(path.shift());
                            if (scope && scope.set) {
                                scope.set(path.join("."), value, options);
                                return this;
                            }

                        }

                        attributes[key] = value;
                    } else {
                        options = value;
                        attributes = key;
                    }

                    options = options || {silent: false, unset: false};

                    // for unsetting attributes
                    if (options.unset) {
                        for (key in attributes) {
                            attributes[key] = void 0;
                        }
                    }

                    var changedAttributes = {},
                        equal = true,
                        now = this.$,
                        val;

                    for (key in attributes) {
                        if (attributes.hasOwnProperty(key)) {
                            // get the value
                            val = attributes[key];
                            // unset attribute or change it ...
                            if (options.unset === true) {
                                delete now[key];
                            } else {
                                if (!_.isEqual(now[key], attributes[key])) {
                                    this.$previousAttributes[key] = now[key];
                                    now[key] = attributes[key];
                                    changedAttributes[key] = now[key];
                                }
                            }
                            // if attribute has changed and there is no async changing process in the background, fire the event

                        }
                    }
                    this._commitChangedAttributes(changedAttributes);

                    if (options.silent === false && _.size(changedAttributes) > 0) {
                        for (key in changedAttributes) {
                            if (changedAttributes.hasOwnProperty(key)) {
                                this.trigger('change:' + key, changedAttributes[key], this);
                            }
                        }
                        this.trigger('change', changedAttributes, this);

                    }

                    return this;
                },
                get: function (key) {
                    var path = key.split(".");
                    var prop = this.$[path.shift()];
                    var key;
                    while (path.length > 0 && prop != null) {
                        key = path.shift();
                        if (prop instanceof Bindable) {
                            prop = prop.get(key);
                        } else if (typeof(prop[key]) !== "undefined") {
                            prop = prop[key];
                        } else {
                            return null;
                        }
                    }
                    return prop;
                },
                _commitChangedAttributes: function (attributes) {

                },
                unset: function (key, options) {
                    (options || (options = {})).unset = true;
                    return this.set(key, null, options);
                },
                clear: function () {
                    return this.set(this.$, {unset: true});
                }
            });

            return Bindable;

        });
});