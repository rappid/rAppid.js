define(['js/core/DomElement', 'js/core/List', 'js/core/Bindable'], function (DomElement, List, Bindable) {

    var SvgElement = DomElement.inherit("js.svg.SvgElement", {

        defaults: {
            transformations: List,
            _transform: null,

            translateX: null,
            translateY: null
        },

        $classAttributes: ["transformations", "translateX", "translateY"],

        ctor: function () {
            // default namespace
            this.$namespace = SvgElement.SVG_NAMESPACE;
            this.callBase();

            this.bind("transformations", "all", this._refreshTransform, this);
        },

        transform: function(transform) {
            if (this.$transform) {
                this.$transform.set("transform", transform);
            } else {
                this.$transform = new SvgElement.Transform({
                    transform: transform
                });
                this.$.transformations.add(this.$transform);
            }

            return this;
        },

        _commitChangedAttributes: function ($) {
            if (this._hasSome($, ["x", "y"])) {
                var x = this.$.translateX;
                var y = this.$.translateY;

                (x || y) && this.translate(x, y);
            }

            this.callBase();
        },

        translate: function (x, y) {

            if (this.$translate) {
                this.$translate.set({
                    x: x,
                    y: y
                });
            } else {
                this.$translate = new SvgElement.Translate({
                    x: x,
                    y: y
                });
                this.$.transformations.add(this.$translate);
            }

            return this;
        },

        rotate: function (r, x, y) {
            if (this.$rotate) {
                this.$rotate.set({
                    r: r,
                    x: x,
                    y: y
                });
            } else {
                this.$rotate = new SvgElement.Translate({
                    r: r,
                    x: x,
                    y: y
                });
                this.$.transformations.add(this.$rotate);
            }
            
            return this;
        },

        _refreshTransform: function () {

            
            var transformations = [];

            this.$.transformations.each(function(t) {
                if (t instanceof SvgElement.TransformBase) {
                    transformations.push(t.toString());
                } else {
                    transformations.push(t);
                }
            });

            this.set('_transform', transformations.join(" "));
        },

        _renderTransform: function() {
            // transforms needs to be set via transformations
        },

        _render_transform: function(transform) {
            this._setAttribute("transform", transform);
        },

        // render each href Element in xlink namespace
        _renderHref: function (href, oldHref) {
            this._setAttribute("href", href, SvgElement.XLINK_NAMESPACE);
        }
    });

    SvgElement.XLINK_NAMESPACE = "http://www.w3.org/1999/xlink";
    SvgElement.SVG_NAMESPACE = "http://www.w3.org/2000/svg";

    SvgElement.Matrix = function (a, b, c, d, e, f) {
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

    SvgElement.TransformBase = Bindable.inherit('js.svg.SvgElement.TransformBase', {
    });

    SvgElement.Transform = SvgElement.TransformBase.inherit('js.svg.SvgElement.TransformBase', {
        defaults: {
            transform: null
        },

        toString: function() {
            return this.$.transform || "";
        }
    });

    SvgElement.Translate = SvgElement.TransformBase.inherit("js.svg.SvgElement.Translate", {
        toString: function () {
            return "translate(" + (this.$.x || 0) + "," + (this.$.y || 0) + ")";
        }
    });


    SvgElement.Rotate = SvgElement.TransformBase.inherit("js.svg.SvgElement.Rotate", {

        defaults: {
            r: 0,
            x: 0,
            y: 0
        },

        toString: function () {
            return "rotate(" + (this.$.r || 0) + "," + (this.$.x || 0) + "," + (this.$.y || 0) + ")";
        }
    });


    return SvgElement;
});