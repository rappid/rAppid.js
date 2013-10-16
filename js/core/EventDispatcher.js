define(["js/core/Base", 'rAppid'], function (Base, rAppid) {

    /***
     * @param {arguments} eventTypes
     * */

    rAppid.extendFunctionPrototype("on", function () {
        var events = Array.prototype.slice.call(arguments);
        this._events = this._events || [];
        for (var i = 0; i < events.length; i++) {
            var event = events[i];
            this._events.push(event);
        }

        if (!this.trigger) {
            this.trigger = function () {
            };
        }

        return this;
    });

    rAppid.extendFunctionPrototype("onChange", function () {
        var events = Array.prototype.slice.call(arguments);
        this._events = this._events || [];
        this._attributes = this._attributes || [];
        var event;
        for (var i = 0; i < events.length; i++) {
            event = events[i];
            this._attributes.push(event);
        }

        if (!this.trigger) {
            this.trigger = function () {
            };
        }

        return this;
    });

    rAppid.extendFunctionPrototype("bus", function () {

        var events = Array.prototype.slice.call(arguments);
        this._busEvents = this._busEvents || [];
        for (var i = 0; i < events.length; i++) {
            this._busEvents.push(events[i]);
        }

        return this;
    });

    var undefinedValue;

    /***
     * @summary Allows binding and triggering of custom events
     */
    var EventDispatcher = Base.inherit("js.core.EventDispatcher",
        {

            ctor: function () {
                this.callBase();
                this._eventHandlers = {};
            },

            /**
             * Binds a callback and a scope to a given eventType
             *
             * @param {String} eventType The name of the event
             * @param {Function} callback The callback function - signature callback({@link EventDispatcher.Event},[caller])
             * @param {Object} [scope]  This sets the scope for the callback function
             */
            bind: function (eventType, callback, scope) {
                if (callback) {
                    scope = scope || this;
                    // get the list for the event
                    var list = this._eventHandlers[eventType] || (this._eventHandlers[eventType] = []);
                    // and push the callback function
                    if (callback instanceof EventDispatcher.EventHandler) {
                        list.push(callback);
                    } else {
                        list.push(new EventDispatcher.EventHandler(callback, scope));
                    }
                } else {
                    this.log('no eventHandler for "' + eventType + '"', "warn");
                }

                return this;
            },

            /**
             * Triggers a specific event and the * event
             *
             * @param {String} eventType
             * @param {EventDispatcher.Event|Object} event If you use an Object the object is wrapped in an Event
             * @param target
             */
            trigger: function (eventType, event, target) {

                if (!(event instanceof EventDispatcher.Event)) {
                    event = new EventDispatcher.Event(event);
                }

                if (!event.target) {
                    event.target = target || this;
                }

                event.type = eventType;


                if (!(this._eventHandlers[eventType] || this._eventHandlers["*"])) {
                    return event;
                }

                var list,
                    result, i;

                if (this._eventHandlers[eventType]) {

                    list = this._eventHandlers[eventType].slice();
                    for (i = 0; i < list.length; i++) {
                        if (list[i]) {
                            result = list[i].trigger(event, event.target);
                            if (result !== undefinedValue) {

                                if (result === false) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                }
                            }

                            if (event.isImmediatePropagationStopped) {
                                break;
                            }
                        }
                    }
                }

                if (this._eventHandlers["*"]) {

                    list = this._eventHandlers["*"].slice();
                    for (i = 0; i < list.length; i++) {
                        if (list[i]) {
                            result = list[i].trigger(event, target);
                            if (result !== undefinedValue) {

                                if (result === false) {
                                    event.preventDefault();
                                    event.stopPropagation();
                                }
                            }

                            if (event.isImmediatePropagationStopped) {
                                break;
                            }
                        }
                    }
                }

                return event;
            },

            /***
             * Unbinds callbacks for events
             *
             * @param {String} eventType
             * @param {Function} callback
             */
            unbind: function (eventType, callback, scope) {
                if (!eventType) {
                    // remove all events
                    this._eventHandlers = {};
                } else if (!callback) {
                    // remove all callbacks for these event
                    this._eventHandlers[eventType] = [];
                } else if (this._eventHandlers[eventType]) {
                    var list = this._eventHandlers[eventType];
                    for (var i = list.length - 1; i >= 0; i--) {
                        if (list[i].$callback == callback && (!scope || scope === list[i].scope)) {
                            list.splice(i, 1);  // delete callback
                        }
                    }
                }
            },

            /***
             * Clears up the instance
             */
            destroy: function () {
                if (this.$destroyed) {
                    // nothing to do here
                    return;
                }

                this._beforeDestroy();

                this._innerDestroy();

                this._destroyCompleted();
            },

            _beforeDestroy: function () {

            },

            _innerDestroy: function () {

            },

            _destroyCompleted: function () {
                this.$destroyed = true;
                // first trigger event
                this.trigger('destroy');
                // then remove all event listeners
                this._eventHandlers = {};
            }

        });

    EventDispatcher.Event = Base.inherit(
        {
            /**
             * Description of constructor.
             * @param {Object} attributes Hash of attributes
             */
            ctor: function (attributes, target) {
                this.$ = attributes;

                this.target = target;
                this.isDefaultPrevented = false;
                this.isPropagationStopped = false;
                this.isImmediatePropagationStopped = false;

            },

            /**
             * Prevent default triggering
             */
            preventDefault: function () {
                this.isDefaultPrevented = true;

                if (this.$) {
                    var e = this.$.orginalEvent;

                    if (e) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        } else {
                            e.returnValue = false;  // IE
                        }
                    }
                }
            },

            /**
             * Call this to stop propagation
             */
            stopPropagation: function () {
                this.isPropagationStopped = true;
            },


            stopImmediatePropagation: function () {
                this.isImmediatePropagationStopped = true;
                this.stopPropagation();
            }
        });


    /***
     * @summary Simple EventHandler
     */
    EventDispatcher.EventHandler = Base.inherit("js.core.EventDispatcher.EventHandler", {
        /**
         * @param {Function} callback The callback function
         * @param {Object} scope The callback scope
         */
        ctor: function (callback, scope) {
            this.scope = scope;
            this.$callback = callback;
        },

        /**
         * @param {js.core.EventDispatcher.Event} event
         * @param {Object} caller
         */
        trigger: function (event, caller) {
            this.$callback.call(this.scope, event, caller);
            return !event.isPropagationStopped;
        }
    });

    return EventDispatcher;
});