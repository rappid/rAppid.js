rAppid.defineClass("js.core.Router", ["js.core.Component"], function(Component){
    var Router = Component.inherit({
        initialize: function() {
            this.callBase();

            // start the router and attach to history
        },
        navigate: function(to, createHistoryEntry, triggerRoute) {
            // TODO: implement
        }
    });

    return Router;
});