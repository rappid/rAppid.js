define(["js/ui/View", "js/ui/ItemsView"], function(View, ItemsView) {
    return View.inherit("js.ui.ScrollableClass", {

        defaults: {
            direction: 'vertical',
            size: 100,
            itemsSize: 100,
            totalCount: 12,
            scrollPaneSize: 12 * 100,
            itemsPerPage: 1,
            page: 0
        },

        addChild: function (child) {
            this.callBase();

            if (child instanceof ItemsView) {
                this.$itemsView = child;
            }
        },

        _renderScrollPaneSize: function (height) {
            this.$itemsView.set('height', height);
        },

        _calculateItemPosition: function (index) {
            return index * this.$.itemsSize + this.$.page * this.$.itemsPerPage * this.$.itemsSize;
        },

        _renderPage: function () {
            var childViews = this.$itemsView.$childViews, view;
            for (var i = 0; i < childViews.length; i++) {
                view = childViews[i];
                view.set('style', ['top', this._calculateItemPosition(i)].join(":"));
            }
        }

    });
});