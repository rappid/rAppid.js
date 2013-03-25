define(["js/core/Application", "js/core/List"], function (Application, List) {
    return Application.inherit({
        defaults: {
            items: null
        },

        ctor: function () {

            this.callBase();

            this.set('sv1_items', new List([
                {
                    id: 1,
                    value: "A"
                },
                {
                    id: 2,
                    value: "B"
                }
            ]));

            this.set('sv2_items', new List([
                {
                    id: 1,
                    value: "Adam"
                },
                {
                    id: 2,
                    value: "Bob"
                }
            ]));

            this.set('sv3_items', new List([
                {
                    id: 1,
                    value: "Adam"
                },
                {
                    id: 2,
                    value: "Bob"
                }
            ]));

            this.set('sv4_items', new List([
                {
                    id: 1,
                    value: "Adam"
                },
                {
                    id: 2,
                    value: "Bob"
                }
            ]));
        }
    });
});
