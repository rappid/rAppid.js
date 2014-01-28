define(["js/ui/View"], function (View) {

    return View.inherit({

        defaults: {
            /***
             * the html to render
             * @type String
             */
            html: null
        },

        _getChildrenFromDescriptor: function () {
            return [];
        },

        render: function () {
            var el = this.callBase();
            while (this.$descriptor.childNodes.length) {
                el.appendChild(this.$descriptor.unshift());
            }
            return el;
        },

        _renderChildren: function () {
        },

        _renderContentChildren: function () {
        },

        _renderHtml: function (html) {
            html = html || "";
            this.$el.innerHTML = html;
        }
    });
});