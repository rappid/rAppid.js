rAppid.defineClass("js.core.UIComponent",
    ["underscore", "js.core.Component"], function (_, Composite) {
        return Composite.inherit({
            render: function() {
                return document.createElement("span");
            }
        });
    }
);