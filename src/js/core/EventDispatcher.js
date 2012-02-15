rAppid.defineClass("js.core.EventDispatcher",
    [],
    /**
     * Base class for trigger and listen to events
     * @export js/core/EventDispatcher
     */
    function () {

        var undefinedValue;

        var EventDispatcher = js.core.Base.inherit({
            ctor: function() {
                this.callBase();
                this._eventHandlers = {};
            },
            on: function (eventType, callback, scope) {
                scope = scope || this;

                // get the list for the event
                var list = this._eventHandlers[eventType] || (this._eventHandlers[eventType] = []);
                // and push the callback function
                list.push(new EventDispatcher.EventHandler(callback, scope));

                return this;
            },
            /**
             *
             * @param {String} eventType
             * @param {js.core.EventDispatcher.Event|Object} event
             * @param caller
             */
            trigger: function (eventType, event, caller) {

                if (this._eventHandlers[eventType]) {
                    if (!(event instanceof EventDispatcher.Event)) {
                        event = new EventDispatcher.Event(event);
                    }

                    if(!caller){
                        caller = arguments.callee.caller;
                    }

                    event.type = eventType;

                    var list = this._eventHandlers[eventType];
                    for (var i = 0; i < list.length; i++) {
                        if (list[i]) {
                            var result = list[i].trigger(event, caller);

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
            unbind: function (eventType, callback) {
                if (!eventType) {
                    // remove all events
                    this._eventHandlers = {};
                } else if (!callback) {
                    // remove all callbacks for these event
                    this._eventHandlers[eventType] = [];
                } else if (this._eventHandlers[eventType]) {
                    var list = this._eventHandlers[eventType];
                    for (var i = list.length - 1; i >= 0; i--) {
                        if (list[i] == callback) {
                            list.splice(i, 1);  // delete callback
                        }
                    }
                }
            }
        });

        EventDispatcher.Event = js.core.Base.inherit({
            ctor: function(attributes){
                this.$ = attributes;

                this.isDefaultPrevented = false;
                this.isPropagationStopped = false;
                this.isImmediatePropagationStopped = false;

            },
            preventDefault: function() {
                this.isDefaultPrevented = true;

                var e = this.orginalEvent;

                if (e) {
                    if (e.preventDefault) {
                        e.preventDefault();
                    } else {
                        e.returnValue = false;  // IE
                    }
                }
            },
            stopPropagation: function () {
                this.isPropagationStopped = true;

                var e = this.originalEvent;
                if (e) {
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    e.cancelBubble = true;
                }
            },
            stopImmediatePropagation: function() {
                this.isImmediatePropagationStopped = true;
                this.stopPropagation();
            }
        });

        EventDispatcher.EventHandler = js.core.Base.inherit(({
            ctor: function(callback, scope) {
                this.$callback = callback;
                this.scope = scope;
            },
            trigger: function(event, caller) {
                this.$callback.call(this.scope, event, caller);
            }
        }));

        return EventDispatcher;
    }
);