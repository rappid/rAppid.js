define(["js/ui/View"], function (View) {
    return View.inherit(({

        $classAttributes: ["name"],

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