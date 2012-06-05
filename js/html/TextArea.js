define(["js/html/HtmlElement", "js/core/TextElement"], function (HtmlElement, TextElement) {
        return HtmlElement.inherit("js.html.TextArea", {
            _renderChild: function (child) {
                if (child instanceof TextElement) {
                    // contains two way binding ...
                    var text = this._getTextContentFromDescriptor(child.$descriptor);
                    /*
                     if(this._isBindingDefinition(text)){
                     this._initBinding(text,"value");
                     } */
                }
            },
            _renderValue: function (value) {
                if (Element.textContent) {
                    this.$el.textContent = value;
                } else {
                    this.$el.innerText = value;
                }

            },
            _bindDomEvents: function () {
                var self = this;
                this.addEventListener('change', function (e) {
                    self.set('value', e.target ? e.target.value : self.$el.innerText);
                });
            }
        });
    }
);