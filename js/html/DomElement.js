rAppid.defineClass("js.html.DomElement",
    ["js.core.Component"], function(Component) {
        return Component.inherit({
                ctor: function (tagname, namespace) {
                    this.$tagname = tagname;
                    this.$namespace = namespace || "http://www.w3.org/1999/xhtml";
                }
            }
        )
    }
);