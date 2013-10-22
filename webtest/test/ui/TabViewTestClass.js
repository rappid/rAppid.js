define(["js/core/Application", "js/core/List"], function (Application, List) {
    return Application.inherit({
        defaults: {
            items: null
        },

        ctor: function () {

            this.callBase();

        }
    });
});
