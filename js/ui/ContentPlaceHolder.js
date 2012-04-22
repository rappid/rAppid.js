define(["js/ui/View"], function (View) {
    return View.inherit(({
        _renderContent: function (content) {
            this._clearRenderedChildren();
            if (content) {
                this._renderChildren(content.$children);
            }
        }
    }));
});