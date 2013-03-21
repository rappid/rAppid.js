define(["js/html/HtmlElement", "js/core/TextElement", "js/core/BindingCreator"], function (HtmlElement, TextElement, BindingCreator) {
        return HtmlElement.inherit("js.html.TextArea", {

            defaults: {
                updateOnEvent: 'change'
            },

            $classAttributes: ["updateOnEvent"],

            _renderChild: function (child) {
                if (child instanceof TextElement) {
                    // contains two way binding ...
                    var text = this.$bindingCreator.evaluate(this._getTextContentFromDescriptor(child.$descriptor), this, "value");
                    this.set('value', text);
                }
            },
            _renderValue: function (value) {
                this.$el.value = String(value);
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