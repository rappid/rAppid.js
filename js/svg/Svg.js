define(['js/svg/SvgElement'], function (SvgElement) {

    return SvgElement.inherit("js.svg.Svg", {

        defaults: {
            tagName: "svg",
            viewBox: "0 0 100 100"
        },

        setViewBox: function (x, y, width, height) {

            this.$viewBoxX = x;
            this.$viewBoxY = y;
            this.$viewBoxWidth = width;
            this.$viewBoxHeight = height;

            this.set("viewBox", [x, y, width, height].join(" "));
        },

        localToGlobalFactor: function() {
            return {
                x: this.$.width / this.$viewBoxWidth,
                y: this.$.height / this.$viewBoxHeight
            }
        },

        globalToLocalFactor: function () {
            return {
                x: this.$viewBoxWidth / this.$.width,
                y: this.$viewBoxHeight / this.$.height
            }
        }

    });
});