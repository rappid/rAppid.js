rAppid.defineClass("js.core.Script", ["js.core.Element"], function(Element){
    return Element.inherit({
        // all the crazy stuff is done in xaml.js
        evaluate: function(imports) {

            var fn = eval(this.$descriptor.textContent);
            return fn.apply(this, imports);
        }
    });
});