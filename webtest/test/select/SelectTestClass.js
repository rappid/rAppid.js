define(["js/core/Application", "js/core/List"], function (Application, List) {
    return Application.inherit({
        defaults: {
            items: null
        },

        ctor: function () {

            this.callBase();

            this.set('items', new List([
                {
                    id: 1,
                    value: "A"
                },
                {
                    id: 2,
                    value: "B"
                }
            ]));

        }
    });
});
