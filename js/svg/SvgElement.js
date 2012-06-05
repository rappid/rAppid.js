define(['js/html/DomElement'], function(DomElement) {
    return DomElement.inherit("js/svg/SvgElement", {
        _renderAttributes: function() {
            this.callBase();
        }
    });
});