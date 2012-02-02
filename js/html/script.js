rAppid.defineClass("js.html.script",
    ["js.html.DomElement"], function(DomElement) {
        return DomElement.inherit({
            ctor: function (tagname, namespace) {
                this.base.ctor.callBase(this, tagname, namespace);
            },
            evaluate: function(){
                return eval(this.$descriptor.textContent);
            }
        });
    }
);