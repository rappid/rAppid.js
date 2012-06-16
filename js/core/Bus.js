define(['js/core/EventDispatcher'], function(EventDispatcher) {
    // no extra functionality needed, but we need a separate instance
    return EventDispatcher.inherit('js.core.Bus', {
    });
});