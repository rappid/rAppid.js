define(["js/html/DomElement"], function (DomElement) {
    return DomElement.inherit("js.html.DomElement", {
        defaults: {
            tagName: "div"
        },
        $behavesAsDomElement: false
    });
});