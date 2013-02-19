define(
    ["js/html/HtmlElement"], function (HtmlElement) {
        return HtmlElement.inherit("js.html.Option", {
            _renderSelected: function (selected) {
                this.$el.selected = selected;
            },
            _renderEnabled: function(enabled){
                if(!enabled){
                    this.$el.setAttribute("disabled","disabled");
                } else{
                    this.$el.removeAttribute("disabled");
                }
            }
        });
    }
);