define(["js/html/DomElement"], function (DomElement) {
    return DomElement.inherit("js.core.UIComponent", {
        defaults: {
            tagName: "div"
        }
    });
});