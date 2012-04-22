define(["js/core/Element"], function (Element) {
    return Element.inherit("js.core.Script", {
        // all the crazy stuff is done in xaml.js
        evaluate: function (imports) {
            var textContent = this._getTextContentFromDescriptor(this.$descriptor);
            var fn = eval("this.javascript = (" + textContent + ")");
            return fn.apply(this, imports);
        }
    });
});