define(['js/core/DomElement'], function(DomElement) {

    var SvgElement = DomElement.inherit("js.svg.SvgElement", {

        ctor: function() {
            // default namespace
            this.$namespace = SvgElement.SVG_NAMESPACE;
            this.$transformations = [];

            this.callBase();
        },

        resetTransform: function() {
            if (this.$transformation.length) {
                this.$transformation = [];
                this._refreshTransform();
            }
        },

        addTransform: function(transform) {
            if (transform) {
                this.$transformations.push(transform);
                this._refreshTransform();
            }
        },

        translate: function(x, y) {
            if (x && y) {
                this.addTransform(new SvgElement.Translate(x, y));
            }
            return this;
        },

        rotate: function(r, x, y) {
            this.addTransform(new SvgElement.Rotate(r, x, y));
            return this;
        },

        _refreshTransform: function() {

            var transformations = [];
            for (var i = 0; i < this.$transformations.length; i++) {
                var t = this.$transformations[i];

                if (t instanceof SvgElement.Transform) {
                    transformations.push(t.toString());
                } else {
                    transformations.push(t);
                }
            }

            this.set('transform', transformations.join(" "));
        },

        // render each href Element in xlink namespace
        _renderHref: function(href, oldHref) {
            this._setAttribute("href", href, SvgElement.XLINK_NAMESPACE);
        },

        _renderClass: function(value) {
            this._setAttribute('class', value);
        }
    });

    SvgElement.XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
    SvgElement.SVG_NAMESPACE = "http://www.w3.org/2000/svg";

    SvgElement.Matrix = function(a, b, c, d, e, f) {
        if (arguments.length) {
            this.a = a;
            this.b = b;
            this.c = c;
            this.d = d;
            this.e = e;
            this.f = f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    };

    SvgElement.Transform = function() {
    };

    SvgElement.Translate = SvgElement.Transform.inherit({
        ctor: function(x, y) {
            this.x = x;
            this.y = y;
        },
        toString: function() {
            return "translate(" + this.x + "," + this.y + ")";
        }
    });

    SvgElement.Rotate = SvgElement.Transform.inherit({
        ctor: function(r, x, y) {
            this.r = r || 0;
            this.x = x || 0;
            this.y = y || 0;
        },
        toString: function() {
            return "rotate(" + this.r + "," + this.x + "," + this.y + ")"
        }
    });


    return SvgElement;
});