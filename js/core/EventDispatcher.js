define(["js/core/Base"],
    function (Base) {

        /***
         * @param {arguments} eventTypes
         * */
        Function.prototype.on = function () {

            var events = Array.prototype.slice.call(arguments, 0);
            this._events = this._events || [];
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                this._events.push(event);
            }

            return this;
        };


        /***
         * @param {arguments} changeEvents results in change:eventName
         * */
        Function.prototype.onChange = function () {
            var events = Array.prototype.slice.call(arguments, 0);
            this._events = this._events || [];
            this._attributes = this._attributes || [];
            for (var i = 0; i < events.length; i++) {
                var event = events[i];
                this._attributes.push(event);
                event = "change:" + event;
                this._events.push(event);

            }
            return this;
        };

        Function.prototype.bus = function() {

            var events = Array.prototype.slice.call(arguments);
            this._busEvents = this._busEvents || [];
            for (var i = 0; i < events.length; i++) {
                this._busEvents.push(events[i]);
            }

            return this;
        };

        var undefinedValue;

        /** @class */
        var EventDispatcher = Base.inherit("js.core.EventDispatcher",
            /** @lends EventDispatcher.prototype */
            {

                /**
                 * @class Allows binding and triggering of custom events
                 * @constructs
                 */
                ctor: function () {
                    this.callBase();
                    this._eventHandlers = {};
                },
                /**
                 * Binds a callback and a scope to a given eventType
                 * @public
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
                        list.push(new EventDispatcher.EventHandler(callback, scope));
                    } else {
                        console.warn('no eventHandler for "' + eventType + '"');
                    }

                    return this;
                },
                /**
                 * Triggers an event
                 * @public
                 * @param {String} eventType
                 * @param {EventDispatcher.Event|Object} event If you use an Object the object is wrapped in an Event
                 * @param target
                 */
                trigger: function (eventType, event, target) {

                    if (this._eventHandlers[eventType]) {
                        if (!(event instanceof EventDispatcher.Event)) {
                            event = new EventDispatcher.Event(event);
                        }

                        if (!target) {
                            target = arguments.callee.caller;
                        }
                        event.target = target;
                        event.type = eventType;

                        var list = this._eventHandlers[eventType];
                        for (var i = 0; i < list.length; i++) {
                            if (list[i]) {
                                var result = list[i].trigger(event, target);

                                if (result !== undefinedValue) {
                                    ret = result;
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
                 * @public
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
                destroy: function(){
                    // remove all events
                    this._eventHandlers = {};
                }
            });

        EventDispatcher.Event = Base.inherit(
            /** @lends EventDispatcher.Event.prototype */
            {
                /**
                 * Description of constructor.
                 * @class Description of class.
                 * @constructs
                 * @params {Object} attributes Hash of attributes
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
                 * @public
                 */
                preventDefault: function () {
                    this.isDefaultPrevented = true;

                    var e = this.$.orginalEvent;

                    if (e) {
                        if (e.preventDefault) {
                            e.preventDefault();
                        } else {
                            e.returnValue = false;  // IE
                        }
                    }
                },
                /**
                 * Call this to stop propagation
                 * @public
                 */
                stopPropagation: function () {
                    this.isPropagationStopped = true;
                },
                /**
                 * @public
                 */
                stopImmediatePropagation: function () {
                    this.isImmediatePropagationStopped = true;
                    this.stopPropagation();
                }
            });


        EventDispatcher.EventHandler = Base.inherit(
            /** @lends EventDispatcher.EventHandler.prototype */
            {
                /**
                 * Simple EventHandler
                 * @class
                 * @constructs
                 * @params {Function} callback The callback function
                 * @params {Object} scope The callback scope
                 */
                ctor: function (callback, scope) {
                    this.scope = scope;
                    this.$callback = callback;
                },
                /**
                 *
                 * @param {EventDispatcher.Event} event
                 * @param {Object} caller
                 */
                trigger: function (event, caller) {
                    this.$callback.call(this.scope, event, caller);
                    return !event.isPropagationStopped;
                }
            });

        return EventDispatcher;
    }
);