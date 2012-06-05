define(
    ["js/html/HtmlElement"], function (HtmlElement) {
        return HtmlElement.inherit("js.html.Option", {
            _renderSelected: function (selected) {
                this.$el.selected = selected;
            }
        });
    }
);