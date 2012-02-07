rAppid.defineClass("js.core.EventDispatcher",
    [],
    /**
     * Base class for trigger and listen to events
     * @export js/core/EventDispatcher
     */
    function () {


        var EventDispatcher = js.core.Base.inherit({
            ctor: function() {
                this.callBase();
                this._eventHandlers = {};
            },
            bind: function (eventType, callback, thisArg) {
                // TODO: mkre push thisarg to eventHandlers
                thisArg = thisArg || this;

                // get the list for the event
                var list = this._eventHandlers[eventType] || (this._eventHandlers[eventType] = []);
                // and push the callback function
                list.push(new EventDispatcher.EventHandler(callback, thisArg));

                return this;
            },
            /**
             *
             * @param {String} eventType
             * @param {js.core.EventDispatcher.Event|Object} event
             * @param target
             */
            trigger: function (eventType, event, target) {
                if (this._eventHandlers[eventType]) {
                    if (!(event instanceof EventDispatcher.Event)) {
                        event = new EventDispatcher.Event(event);
                    }
                    event.type = eventType;
                    if(!event.target){
                        event.target = target || this;
                    }

                    var list = this._eventHandlers[eventType];
                    for (var i = 0; i < list.length; i++) {
                        if (list[i]) {
                            list[i].trigger(event);
                        }
                    }
                }
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
            }
        });

        EventDispatcher.EventHandler = js.core.Base.inherit(({
            ctor: function(callback, thisArg) {
                this.$callback = callback;
                this.$thisArg = thisArg;
            },
            trigger: function(event) {
                this.$callback.call(this.$thisArg, event);
            }
        }));

        return EventDispatcher;
    }
);