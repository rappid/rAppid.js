rAppid.defineClass("js.html.div",
    ["js.html.DomElement"], function(DomElement) {
        return DomElement.inherit({
            ctor: function (tagname, namespace) {
                this.base.ctor.callBase(this, tagname, namespace);
            }
        });
    }
);