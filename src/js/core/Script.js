rAppid.defineClass("js.core.Script", ["js.core.Component"], function(Component){
    return Component.inherit({
        // all the crazy stuff is done in xaml.js
        evaluate: function() {
            return eval(this.$descriptor.textContent);
        }
    });
});