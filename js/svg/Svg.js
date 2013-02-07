define(['xaml!js/svg/SvgDescriptor', 'js/core/Base'], function (SvgElement, Base) {

    var Svg = SvgElement.inherit("js.svg.Svg", {

        defaults: {
            tagName: "svg",
            viewBox: "0 0 100 100"
        },

        $classAttributes: ["defs"],

        ctor: function() {
            this.callBase();
            this.fontManager = new Svg.FontManager(this);
            this.$svgRoot = this;

            this.setViewBox.apply(this,this.$.viewBox.split(" "));
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

    Svg.FontManager = Base.inherit("js.svg.Svg.FontManager", {

        ctor: function(svg) {
            this.$svg = svg;
            this.$fontCache = {};

            this.callBase();
        },

        loadExternalFont: function (fontFamily, src) {
            var svg = this.$svg;

            var ret = svg.$templates["external-font"].createInstance({
                $fontFamily: fontFamily,
                $src: src
            });

            svg.$.defs.addChild(ret);

            this.$fontCache[fontFamily] = ret;

            return ret;
        }
    });

    return Svg;
});