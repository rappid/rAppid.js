define(['js/core/DomElement', 'js/core/List', 'js/core/Bindable'], function (DomElement, List, Bindable) {

    var undefined,
        SvgElement = DomElement.inherit("js.svg.SvgElement", {

            defaults: {
                transformations: List,
                _transform: null,

                translateX: undefined,
                translateY: undefined,

                scaleX: undefined,
                scaleY: undefined,

                rotation: undefined,
                rotationX: undefined,
                rotationY: undefined
            },

            $classAttributes: ["transformations", "translateX", "translateY", "scaleX", "scaleY", "rotation", "rotationX", "rotationY"],

            ctor: function () {
                // default namespace
                this.$namespace = SvgElement.SVG_NAMESPACE;
                this.callBase();

                this.bind("transformations", '*', this._refreshTransform, this);
            },

            transform: function (transform) {
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

            addChild: function (child) {
                this.callBase();
                child.$svgRoot = this.$svgRoot;
            },

            getSvgRoot: function () {
                if(!this.$svgRoot){
                    var parent = this.$parent;
                    while(parent instanceof SvgElement && !parent.$svgRoot){
                        parent = parent.$parent;
                    }

                    if (!parent) {
                        return null;
                    }

                    return parent.$svgRoot;

                }
                return this.$svgRoot;
            },

            _commitChangedAttributes: function ($) {
                var x, y, r;

                if (this._hasSome($, ["translateX", "translateY"])) {
                    x = this.$.translateX;
                    y = this.$.translateY;

                    !(x === undefined && y === undefined) && this.translate(x, y);
                }

                if (this._hasSome($, ["scaleX", "scaleY"])) {
                    x = this.$.scaleX;
                    y = this.$.scaleY;

                    !(x === undefined && y === undefined) && this.scale(x, y);
                }

                if (this._hasSome($, ["rotation", "rotationX", "rotationY"])) {
                    r = this.$.rotation;
                    x = this.$.rotationX;
                    y = this.$.rotationY;

                    !(x === undefined && y === undefined && r === undefined) && this.rotate(r, x, y);
                }


                this.callBase();
            },

            scale: function (sx, sy) {

                if (sx === null || sy === null) {
                    return;
                }

                if (!sy && sy !== 0) {
                    sy = sx;
                }

                if (this.$scale) {
                    this.$scale.set({
                        sx: sx,
                        sy: sy
                    });
                } else {
                    this.$scale = new SvgElement.Scale({
                        sx: sx,
                        sy: sy
                    });
                    this.$.transformations.add(this.$scale);
                }

                return this;
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
                    this.$rotate = new SvgElement.Rotate({
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

                this.$.transformations.each(function (t) {
                    if (t instanceof SvgElement.TransformBase) {
                        transformations.push(t.toString());
                    } else {
                        transformations.push(t);
                    }
                });

                this.set('_transform', transformations.join(" "));
            },

            _renderTransform: function () {
                // transforms needs to be set via transformations
            },

            _render_transform: function (transform) {
                this._setAttribute("transform", transform);
            },

            // render each href Element in xlink namespace
            _renderHref: function (href) {
                this._setAttribute("href", href, SvgElement.XLINK_NAMESPACE);
            },

            _renderId: function(id) {
                this._setAttribute("id", id);
            },

            localToGlobalFactor: function () {
                if (this.$parent) {
                    // TODO: add scale
                    return this.$parent.localToGlobalFactor();
                }

                return {
                    x: 1,
                    y: 1
                };
            },

            globalToLocalFactor: function () {
                if (this.$parent) {
                    // TODO: add scale
                    return this.$parent.globalToLocalFactor();
                }

                return {
                    x: 1,
                    y: 1
                };
            },

            localPointToGlobal: function (point) {

                var factor = this.localToGlobalFactor();

                return {
                    x: point.x * factor.x,
                    y: point.y * factor.y
                };
            },

            globalPointToLocal: function (point) {

                var factor = this.globalToLocalFactor();

                return {
                    x: point.x * factor.x,
                    y: point.y * factor.y
                };

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

    /***
     * @inherit js.svg.SvgElement.TransformBase
     */
    SvgElement.Transform = SvgElement.TransformBase.inherit('js.svg.SvgElement.Transform', {
        defaults: {
            transform: null
        },

        toString: function () {
            return this.$.transform || "";
        }
    });

    /***
     * @inherit js.svg.SvgElement.TransformBase
     */
    SvgElement.Translate = SvgElement.TransformBase.inherit("js.svg.SvgElement.Translate", {
        toString: function () {
            return "translate(" + (this.$.x || 0) + "," + (this.$.y || 0) + ")";
        }
    });

    /***
     * @inherit js.svg.SvgElement.TransformBase
     */
    SvgElement.Scale = SvgElement.TransformBase.inherit("js.svg.SvgElement.Scale", {

        defaults: {
            sx: 1,
            sy: 1
        },

        toString: function () {
            return "scale(" + this.$.sx + "," + this.$.sy + ")";
        }
    });


    /***
     * @inherit js.svg.SvgElement.TransformBase
     */
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