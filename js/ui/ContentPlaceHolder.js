define(["js/ui/View"], function (View) {
    return View.inherit(({

        $classAttributes: ["name"],

        _renderContent: function (content) {
            this._clearRenderedChildren();
            if (content) {
                this._renderChildren(content.getChildren());
            }
        }
    }));
});