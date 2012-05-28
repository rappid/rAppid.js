define(
    ["js/core/Element", "js/core/BindingCreator", "underscore"], function (Element, BindingCreator, _) {

        var bindingCreator = new BindingCreator();

        return Element.inherit("js.core.TextElement", {
            _initializeBindings: function () {
                if (this.$descriptor) {
                    var textContent = this._getTextContentFromDescriptor(this.$descriptor);
                    this.$.textContent = bindingCreator.evaluate(textContent, this, "textContent");
                }

            },
            render: function () {
                if (!this.$initialized) {
                    this._initialize(this.$creationPolicy);
                }

                this.$el = this.$systemManager.$document.createTextNode("");
                if (!_.isUndefined(this.$.textContent)) {
                    this._renderTextContent(this.$.textContent);

                }

                return this.$el;
            },
            _renderTextContent: function (textContent) {
                this.$el.data = textContent;
            },
            _commitChangedAttributes: function (attributes) {
                if (this.$el) {
                    if (!_.isUndefined(attributes.textContent)) {
                        this._renderTextContent(attributes.textContent);
                    }
                }
            }
        });
    }
);