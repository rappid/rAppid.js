rAppid.defineClass("app.OrganizerClass", ["js.core.Application"], function(Application) {
    return Application.inherit({
        start: function(parameter, callback) {
            this.callBase(parameter, callback);

            //this.history.navigate("articles");
        }
    });
});