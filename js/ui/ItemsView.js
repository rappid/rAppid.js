define(["js/ui/View", "js/core/Repeat"], function (View, Repeat) {

    return View.inherit('js.ui.ItemsView', {

        defaults: {
            items: null,
            itemKey: "item",
            indexKey: "index"
        },

        $defaultTemplateName: "item",


        createChildren: function () {
            var ret = this.callBase() || [];

            var repeat = this.createComponent(Repeat, {
                "items": "{items}",
                "itemKey": this.$.itemKey,
                "indexKey": this.$.indexKey
            }, null);

            this.$repeat = repeat;
            repeat.$defaultTemplateName = null;
            repeat.bind("on:itemsRendered", this._onItemsRendered, this);
            ret.push(repeat);

            return ret;
        },
        addChild: function (child) {
            if (child instanceof Repeat) {
                child.addChild(this.$templates.item);
            }
            this.callBase();
        },

        _onItemsRendered: function () {

        },

        _getItemKey: function () {
            return this.$repeat._getItemKey();
        },
        _getItemsArray: function () {
            return this.$repeat._getItemsArray.apply(this.$repeat, arguments);
        },
        getComponentForItem: function () {
            return this.$repeat.getComponentForItem.apply(this.$repeat, arguments);
        }
    });

});