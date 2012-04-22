define(
    ["js/core/Element", "js/core/Binding", "underscore"], function (Element, Binding, _) {

        return Element.inherit("js.core.TextElement", {
            _initializeBindings: function () {
                if (this.$descriptor) {
                    var textContent = this._getTextContentFromDescriptor(this.$descriptor);
                    this.$.textContent = Binding.evaluateText(textContent, this, "textContent");
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