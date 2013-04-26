define(
    ["js/ui/View"], function (View) {

        return View.inherit({
            _getChildrenFromDescriptor: function (descriptor) {
                return [];
            },
            render: function () {
                var el = this.callBase();
                while(this.$descriptor.childNodes.length){
                    el.appendChild(this.$descriptor.unshift());
                }
                return el;
            },
            _renderChildren: function () {

            },
            _renderContentChildren: function () {

            },
            _renderHtml: function (html) {
                this.$el.innerHTML = html;
            }
        });
    }
);