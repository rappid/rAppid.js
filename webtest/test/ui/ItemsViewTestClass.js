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

            this.set('woTemplateItems', new List([
                {
                    value: "A"
                },
                {
                    value: "B"
                }
            ]));

            this.set('cidTemplateItems', new List([
                {
                    value: "A"
                },
                {
                    value: "B"
                }
            ]));
        },
        addItemAt: function (item, index) {
            this.$.items.add(item, {index: index});
        },
        removeItemAt: function(index){
            this.$.items.removeAt(index);
        },
        resetItems: function(){
            this.$.items.reset();
        }
    });
});
