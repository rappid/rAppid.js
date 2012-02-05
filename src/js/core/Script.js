rAppid.defineClass("js.core.Script", ["js.core.Element"], function(Element){
    return Element.inherit({
        // all the crazy stuff is done in xaml.js
        evaluate: function() {
            return eval(this.$descriptor.textContent);
        }
    });
});