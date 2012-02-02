rAppid.defineClass("js.core.EventDispatcher",
    [],
    function () {
        return js.core.Base.inherit({
            ctor: function() {
                this.base.ctor.callBase(this);
            },
            bind: function (event, callback) {

                // get the list for the event
                var list = this.$eventHandlers[event] || (this.$eventHandlers[event] = []);
                // and push the callback function
                list.push(callback);

                return this;
            },
            trigger: function (event, data) {
                if (this.$eventHandlers[event]) {
                    var list = this.$eventHandlers[event];
                    for (var i = 0; i < list.length; i++) {
                        if (list[i]) {
                            list[i].call(this, event, data);
                        }
                    }
                }
            },
            unbind: function (event, callback) {
                if (!event) {
                    // remove all events
                    this.$eventHandlers = {};
                } else if (!callback) {
                    // remove all callbacks for these event
                    this.$eventHandlers[event] = [];
                } else if (this.$eventHandlers[event]) {
                    var list = this.$eventHandlers[event];
                    for (var i = list.length - 1; i >= 0; i--) {
                        if (list[i] == callback) {
                            list.splice(i, 1);  // delete callback
                        }
                    }
                }
            }
        });
    }
);