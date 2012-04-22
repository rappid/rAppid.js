define(
    ["js/html/DomElement"], function (DomElement) {
        return DomElement.inherit("js.html.Option", {
            _renderSelected: function (selected) {
                this.$el.selected = selected;
            }
        });
    }
);