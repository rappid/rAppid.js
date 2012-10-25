define(
    ["js/ui/View"], function (View) {

        return View.inherit({
            _getChildrenFromDescriptor: function (descriptor) {
                return [];
            },
            render: function () {
                var el = this.callBase();
                while(this.$descriptor.childNodes.length){
                    el.appendChild(this.$descriptor.childNodes[0]);
                }
                return el;
            },
            _renderChildren: function () {

            },
            _renderContentChildren: function () {

            },
            _renderHTML: function (html) {
                this.$el.innerHTML = html;
            }
        });
    }
);