define(["js/core/EventDispatcher", "underscore"],
    function (EventDispatcher, _) {

        var indexExtractor = /^(.*)\[(\d+)\]$/,
            undefined, List;

        /** @class */
        var Bindable = EventDispatcher.inherit("js.core.Bindable",
            /** @lends Bindable.prototype */
            {
                /**
                 * @class A Bindable triggers every change of his attributes as 'change' event.
                 * @constructs
                 * @params {Object} attributes a key, value hash
                 */
                ctor: function (attributes) {

                    // call the base class constructor
                    this.callBase(null);

                    this.$ = {};

                    _.extend(this._eventAttributes, this.base._eventAttributes || {});

                    attributes = attributes || {};

                    var defaultAttributes = this._defaultAttributes();
                    for (var key in defaultAttributes) {
                        if (defaultAttributes.hasOwnProperty(key)) {
                            if (_.isFunction(defaultAttributes[key])) {
                                // Function as default -> construct new Object
                                defaultAttributes[key] = new (defaultAttributes[key])();
                            }
                        }
                    }

                    _.defaults(attributes, defaultAttributes);

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
                    // clone all attributes
                    for (var k in ret) {
                        if (ret.hasOwnProperty(k) && !_.isFunction(ret[k])) {
                            ret[k] = _.clone(ret[k]);
                        }
                    }

                    return ret;
                },

                /**
                 * Call this to set attributes
                 * @param {String} key The attribute key
                 * @param {String} value The attribute value
                 * @param {Object} options A hash of options
                 * @param {Boolean} options.silent If true no event is triggered on change
                 * @param {Boolean} options.unset If true the attribute gets deleted
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
                            if (attributes.hasOwnProperty(key)) {
                                attributes[key] = void 0;
                            }
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


                /***
                 *
                 * @param {Object} [scope]
                 * @param {String} key
                 * @returns Attribute value
                 */
                get: function(scope, key) {

                    if (arguments.length === 1) {
                        key = scope;
                        scope = this;
                    }

                    function getValue(scope, key) {
                        if (!key) {
                            return scope;
                        }

                        if (scope instanceof Bindable) {
                            if (scope.$) {
                                return scope.$[key];
                            } else {
                                return undefined;
                            }
                        } else {
                            return scope[key];
                        }
                    }

                    key = key || "";

                    var path = key.split("."),
                        val, index;

                    while (path.length > 0) {
                        if (scope === false) {
                            return null;
                        } else if (!scope) {
                            return scope;
                        }

                        key = path.shift();

                        var params = indexExtractor.exec(key);
                        if (params) {
                            // we got a list
                            key = params[1];
                            index = params[2];

                            var list = getValue(scope, key);

                            if (list instanceof Array) {
                                scope = val = list[index];
                            } else if (list) {
                                if (!List) {
                                    // circular dependency
                                    try {
                                        List = require('js/core/List');
                                    } catch (e) {
                                    }
                                }

                                if (list instanceof List) {
                                    scope = val = list.at(index);
                                } else {
                                    return undefined;
                                }

                            } else {
                                return undefined;
                            }
                        } else {
                            scope = val = getValue(scope, key);
                        }

                    }

                    return val;

                },

                /**
                 *
                 * @param {String} key
                 * @returns true if attribute is not undefined
                 */
                has: function (key) {
                    return !_.isUndefined(this.$[key]);
                },
                /**
                 * This method when attributes have changed after a set
                 * @param {Object} hash of changed attributes
                 */
                _commitChangedAttributes: function (attributes) {
                    // override
                },
                /**
                 * Unsets on attribute key
                 * @param {String} attribute key
                 * @param {Object} options
                 */
                unset: function (key, options) {
                    (options || (options = {})).unset = true;
                    return this.set(key, null, options);
                },
                /**
                 * clears all attributes
                 */
                clear: function () {
                    return this.set(this.$, {unset: true});
                },
                destroy: function() {
                    this.trigger('destroy',this);
                    return this;
                }
            });

        return Bindable;

    });