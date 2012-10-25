define(["js/ui/View"], function (View) {
    return View.inherit(({
        _renderContent: function (content) {
            this._clearRenderedChildren();
            this.$children = [];

            if (content) {
                this.$children = content.getChildren();
                this._renderChildren(this.$children);
            }
        }
    }));
});