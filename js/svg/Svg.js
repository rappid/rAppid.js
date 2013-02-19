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
        },

        save: function() {

            var window = this.$stage.$window;

            // dirty hack to get dom as string
            var div = this.$stage.$document.createElement("div");
            div.appendChild(this.$el.cloneNode(true));
            // dirty hack2
            var svgContent = div.innerHTML.replace(/^\<svg/, "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' ");
            svgContent = svgContent.replace(/(href=['"])\/{2}/g, "$1http://");

            var svg = new Blob([svgContent], {
                type: "image/svg+xml;charset=utf-8"
            });

            var domUrl = window.URL || window.webkitURL || window;
            return domUrl.createObjectURL(svg);

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

            if (!this.$fontCache[fontFamily]) {
                var font = svg.$templates["external-font"].createInstance({
                    $fontFamily: fontFamily,
                    $src: src
                });

                svg.$.defs.addChild(font);

                this.$fontCache[fontFamily] = font;
            }


            return this.$fontCache[fontFamily];
        }
    });

    return Svg;
});