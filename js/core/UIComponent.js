define(["js/html/HtmlElement"], function (HtmlElement) {
    return HtmlElement.inherit("js.core.UIComponent", {
        defaults: {
            tagName: "div"
        }
    });
});