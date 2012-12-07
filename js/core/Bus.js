define(['js/core/EventDispatcher'], function(EventDispatcher) {
    // no extra functionality needed, but we need a separate factory for injection
    return EventDispatcher.inherit('js.core.Bus', {
    });
});