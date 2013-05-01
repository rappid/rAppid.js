define(["js/ui/View"], function (View) {
    return View.inherit({

        defaults: {
            /***
             * the unique name to identify the ContentPlaceHolder
             *
             * @type String
             * @required
             */
            name: null
        },

        _renderContent: function (content) {
            this._clearRenderedChildren();
            this.$children = [];

            if (content) {
                this.$children = content.getChildren();
                this._renderChildren(this.$children);
            }
        }
    });
});