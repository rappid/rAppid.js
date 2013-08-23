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

    Svg.FontManager = Base.inherit("js.svg.Svg.FontManager", {

        ctor: function (svg) {
            this.$svg = svg;
            this.$fontCache = {};

            this.callBase();
        },

        loadExternalFont: function (fontFamily, src, callback) {
            var svg = this.$svg;

            var cache = this.$fontCache[fontFamily];

            if (!cache) {

                var text = svg.$stage.$document.createElementNS(SvgElement.SVG_NAMESPACE, "text");
                text.textContent = "SvgFontMeasurer";
                var hidden = svg.$.hidden.$el;

                hidden.appendChild(text);

                if (src.indexOf(".woff") > -1) {

                    var document = svg.$stage.$document,
                        body = document.getElementsByTagName("body")[0],
                        head = document.getElementsByTagName("head")[0],
                        style = document.createElement("style");

                    style.setAttribute("type", "text/css");

                    /*Paul Irish's smiley method for font loading -
                     http://paulirish.com/2009/bulletproof-font-face-implementation-syntax/ */
                    style.innerHTML = "@font-face{\n" +
                        "font-family: '" + fontFamily + "';" +
//                        "src: url('" + fontPath + ".eot');" +
                        "src: local('Ø'), " +
                        "url('" + src + "') format('woff'); " +
//                        "url('" + fontPath + ".ttf') format('truetype');" +
                        "}\n";

                    head.appendChild(style);

                    //apply this font to the body, this helps IE8
                    //  to actually use the font after it was lazy-loaded
//                    setTimeout(function () {
//                        document.body.css("font-family", fontFamily)
//                    }, 500);


                } else if (src.indexOf(".svg") > -1) {
                    var font = svg.$templates["external-font"].createInstance({
                        $fontFamily: fontFamily,
                        $src: src
                    });
                    svg.$.defs.addChild(font);
                }

                cache = this.$fontCache[fontFamily] = {
//                    font: font,
                    loaded: false,
                    callbacks: [callback]
                };

                var maxChecks = 1000;
                setTimeout(function () {
                    text.setAttribute("font-family", "__ABCDE__");  // set to undefined font and measure

                    var originalBox = text.getBBox();

                    text.setAttribute("font-family", fontFamily); // set to loading font / first undefined
                    setTimeout(checkFontLoaded, 0);

                    function checkFontLoaded() {
                        var current = text.getBBox();

                        // compare bounding boxes of two
                        if (maxChecks > 0 && current.x === originalBox.x && current.y === originalBox.y &&
                            current.width === originalBox.width && current.height === originalBox.height) {
                            maxChecks--;

                            // same check later
                            setTimeout(checkFontLoaded, 100);
                        } else {
                            cache.loaded = true;
                            hidden.removeChild(text);

                            setTimeout(function () {
                                for (var i = 0; i < cache.callbacks.length; i++) {
                                    try {
                                        cache.callbacks[i] && cache.callbacks[i]();
                                    } catch (e) {
                                        // invoke callbacks
                                    }
                                }
                            }, 200);

                        }
                    }
                }, 100);

            } else {

                if (cache.loaded) {
                    callback && callback();
                }
                else {
                    cache.callbacks.push(callback);
                }

            }

        }

    })
    ;

    return Svg;
})
;