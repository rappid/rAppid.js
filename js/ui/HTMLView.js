define(
    ["js/ui/View"], function (View) {

        return View.inherit({
            _getChildrenFromDescriptor: function (descriptor) {
                return [];
            },
            render: function () {
                var el = this.callBase();
                el.appendChild(this.$descriptor.childNodes[0]);

                return el;
            },
            _renderChildren: function () {

            },
            _renderContentChildren: function () {

            },
            _renderHTML: function (html, oldString) {
                this.$el.innerHTML = html;
            }
        });
    }
);