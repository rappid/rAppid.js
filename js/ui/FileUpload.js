define(['js/html/HtmlElement'], function(HtmlElement) {

    return HtmlElement.inherit({

        defaults: {
            tagName: "input",
            multiSelect: false,
            type: "file",

            accept: null
        },

        ctor: function() {
            this.callBase();

            this.bind("on:click", function() {
                if (this.$el) {
                    this.$el.value = '';
                }
            }, this);
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