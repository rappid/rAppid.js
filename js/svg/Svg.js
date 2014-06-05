define(['xaml!js/svg/SvgDescriptor', "js/svg/SvgElement", 'js/core/Base'], function (SvgDescriptor, SvgElement, Base) {

    var Svg = SvgDescriptor.inherit("js.svg.Svg", {

        defaults: {
            tagName: "svg",
            viewBox: "0 0 100 100",

            hidden: null
        },

        $classAttributes: ["defs", "hidden"],

        ctor: function () {
            this.callBase();
            this.fontManager = new Svg.FontManager(this);
            this.$svgRoot = this;

            this.setViewBox.apply(this, this.$.viewBox.split(" "));
        },

        setViewBox: function (x, y, width, height) {

            this.$viewBoxX = x;
            this.$viewBoxY = y;
            this.$viewBoxWidth = width;
            this.$viewBoxHeight = height;

            this.set("viewBox", [x, y, width, height].join(" "));
        },

        localToGlobalFactor: function () {
            return {
                x: this.$.width / this.$viewBoxWidth,
                y: this.$.height / this.$viewBoxHeight
            };
        },

        globalToLocalFactor: function () {
            return {
                x: this.$viewBoxWidth / this.$.width,
                y: this.$viewBoxHeight / this.$.height
            };
        },

        save: function () {

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

    var GlobalFontCache = {};

    Svg.FontManager = Base.inherit("js.svg.Svg.FontManager", {

        ctor: function (svg) {
            this.$svg = svg;
            this.callBase();
        },

        loadExternalFont: function (fontFamily, src, callback) {
            var svg = this.$svg;

            var font = GlobalFontCache[fontFamily];
            var isSvgFont = src.indexOf(".svg") > -1;

            if (!font) {

                var text = svg.$stage.$document.createElementNS(SvgElement.SVG_NAMESPACE, "text");
                text.textContent = "SvgFontMeasurer";
                var hidden = svg.$.hidden.$el;

                hidden.appendChild(text);

                if (/\.woff|\.eot/.test(src)) {

                    var document = svg.$stage.$document,
                        body = document.getElementsByTagName("body")[0],
                        head = document.getElementsByTagName("head")[0],
                        style = document.createElement("style");

                    style.setAttribute("type", "text/css");

                    var srcAttribute = "";
                    if (src.indexOf(".woff") > -1) {
                        srcAttribute = "url('" + src + "') format('woff');";
                    } else {
                        srcAttribute = "url('" + src + "') ;";
                    }

                    /*Paul Irish's smiley method for font loading -
                     http://paulirish.com/2009/bulletproof-font-face-implementation-syntax/ */
                    style.innerHTML = "@font-face{\n" +
                        "font-family: '" + fontFamily + "';" +
//                        "src: url('" + src.replace(".woff",".eot") + "'); " +
//                        "src: url('" + src +);" +
                        "src: " + srcAttribute +
//                        "url('" + fontPath + ".ttf') format('truetype');" +
                        "}\n";

                    head.appendChild(style);


                } else if (src.indexOf(".svg") > -1) {
                    var fontElement = svg.$templates["external-font"].createInstance({
                        $fontFamily: fontFamily,
                        $src: src
                    });
                    svg.$.defs.addChild(fontElement);
                }

                font = GlobalFontCache[fontFamily] = {
//                    font: font,
                    loaded: false,
                    callbacks: [callback]
                };


                var maxChecks = 500,
                    originalBox,
                    current;

                setTimeout(function () {
                    text.setAttribute("font-family", "__ABCDE__");  // set to undefined font and measure
                    try {
                        originalBox = text.getBBox();
                    } catch (e) {
                    }

                    text.setAttribute("font-family", fontFamily); // set to loading font / first undefined
                    setTimeout(checkFontLoaded, 0);

                    function checkFontLoaded() {
                        try {
                            current = text.getBBox();
                        } catch (e) {
                        }

                        // compare bounding boxes of two
                        if (!current || !originalBox || (maxChecks > 0 && current.x === originalBox.x && current.y === originalBox.y &&
                            current.width === originalBox.width && current.height === originalBox.height)) {
                            maxChecks--;

                            // same check later
                            setTimeout(checkFontLoaded, 100);
                        } else {
                            font.loaded = true;
                            hidden.removeChild(text);

                            setTimeout(function () {
                                for (var i = 0; i < font.callbacks.length; i++) {
                                    try {
                                        font.callbacks[i] && font.callbacks[i]();
                                    } catch (e) {
                                        // invoke callbacks
                                    }
                                }
                            }, 200);

                        }
                    }
                }, 100);

            } else {

                if (font.loaded) {

                    if (isSvgFont) {
                        svg.$.defs.addChild(svg.$templates["external-font"].createInstance({
                            $fontFamily: fontFamily,
                            $src: src
                        }));

                    }
                    callback && callback();
                }
                else {
                    font.callbacks.push(callback);
                }

            }

        }

    });

    return Svg;
});