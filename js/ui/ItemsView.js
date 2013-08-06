define(["js/ui/View", "js/core/Repeat"], function (View, Repeat) {

    return View.inherit('js.ui.ItemsView', {

        defaults: {
            items: null,
            itemKey: "item",
            indexKey: "index"
        },

        $defaultTemplateName: "item",

        _initializationComplete: function () {
            this.callBase();
            var repeat = this.createComponent(Repeat, {
                "items": "{items}",
                "itemKey": this.$.itemKey,
                "indexKey": this.$.indexKey
            });
            repeat.$defaultTemplateName = null;
            repeat.addChild(this.$templates.item);
            repeat.bind("on:itemsRendered", this._onItemsRendered, this);
            this.$repeat = repeat;
            this.addChild(repeat);
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