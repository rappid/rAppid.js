define(["js/html/HtmlElement", "js/core/TextElement", "js/core/BindingCreator"], function (HtmlElement, TextElement, BindingCreator) {

        var undefined;

        return HtmlElement.inherit("js.html.TextArea", {

            defaults: {
                updateOnEvent: 'change'
            },

            $classAttributes: ["updateOnEvent"],

            _renderChild: function (child) {
                if (child instanceof TextElement) {
                    var text = this._getTextContentFromDescriptor(child.$descriptor) || "";
                    // extract two way binding
                    var matches = text.match(/{{.+?}}/);
                    text = matches && matches.length > 0 ? matches[0] : text;
                    text = this.$bindingCreator.evaluate(text, this, "value");
                    this.set('value', text);
                }
            },
            _renderValue: function (value) {
                if (value === null || value === undefined) {
                    value = "";
                }
                value = String(value);
                if (this.$el.value != value) {
                    this.$el.value = value;
                }

            },
            _bindDomEvents: function () {
                this.callBase();
                var self = this;
                this.bindDomEvent(this.$.updateOnEvent, function (e) {
                    self.set('value', e.target ? e.target.value : self.$el.innerText);
                });
            }
        });
    }
);