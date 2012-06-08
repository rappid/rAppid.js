define(['js/svg/SvgElement'], function(SvgElement) {

    return SvgElement.inherit("js.svg.Svg", {

        defaults: {
            tagName: "svg",
            viewBox: "0 0 100 100"
        },

        setViewBox: function(x, y, width, height) {
            this.set("viewBox", [x, y, width, height].join(" "));
        }

    });
});