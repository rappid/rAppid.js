rAppid.defineClass("js.core.UIComponent",
    ["underscore", "js.html.DomElement"], function (_, DomElement) {
        return DomElement.inherit({
            _defaults: {
                tagName: "div"
            },
            _renderAttribute:function (key, attr) {

            }
        });
    }
);