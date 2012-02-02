rAppid.defineClass("js.core.Application",
    ["js.core.UIComponent"], function (UIComponent) {
        return UIComponent.inherit({
            start: function(callback) {
                if (callback) {
                    callback(null);
                }
            },
            render: function (target) {
                // TODO: call base method
                var dom = document.createElement("div");

                for (var i = 0; i < this.$children.length; i++) {
                    var child = this.$children[i];
                    if (child instanceof UIComponent) {
                        dom.appendChild(child.render());
                    }

                }

                if (target) {
                    target.appendChild(dom);
                }

                return dom;
            },
            toString: function () {
                return "js.core.Application";
            }
        });
    }
);