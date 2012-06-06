define(['js/html/DomElement'], function(DomElement) {

    var SvgElement = DomElement.inherit("js/svg/SvgElement", {

        ctor: function() {
            // default namespace
            this.$namespace = SvgElement.SVG_NAMESPACE;

            this.callBase();
        },

        // render each href Element in xlink namespace
        _renderHref: function(href, oldHref) {
            this._setAttribute("href", href, SvgElement.XLINK_NAMESPACE);
        }
    });

    SvgElement.XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
    SvgElement.SVG_NAMESPACE = "http://www.w3.org/2000/svg";

    return SvgElement;
});