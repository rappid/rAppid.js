rAppid.defineClass("js.core.Model", ["js.core.EventDispatcher"], function(EventDispatcher) {
    return EventDispatcher.inherit({
        ctor: function() {
            this.base.ctor.callBase(this);
        }
    })
});