define(['js/html/HtmlElement'], function(HtmlElement) {

    return HtmlElement.inherit({

        defaults: {
            tagName: "input",
            multiSelect: false,
            type: "file"
        },

        _renderMultiSelect: function(multiSelect) {
            var multiple = "multiple";
            !multiSelect && this.$el.removeAttribute(multiple);

            if (multiSelect) {
                this.$el.setAttribute(multiple, multiple);
            }
        }

    });
});