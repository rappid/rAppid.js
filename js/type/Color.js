define(['js/core/Base'], function (Base) {

    if (!String.prototype.right) {
        String.prototype.right = function(length) {
            return this.substr(this.length - length);
        };
    }

    var Color = Base.inherit('js.type.Color', {

        distanceTo: function (color) {
            return Color.calculateColorDistance(this, color);
        }

    }, {

        parse: function (color) {

            if (color instanceof Color) {
                return color;
            }

            if (/^#[0-9A-F]{3,6}$/i.test(color)) {
                // #rgb format
                return Color.fromHexString(color);
            }

            if (Object.prototype.toString.call(color) === "[object Number]") {
                return Color.fromHex(color);
            }

            if (color instanceof Object && "r" in color && "g" in color && "b" in color) {
                return new Color.RGB(color.r, color.g, color.b);
            }

            return null;
        },

        fromHexString: function (hexString) {
            return Color.fromHex(parseInt("0x" + hexString.replace(/^#/, "")));
        },

        fromHex: function (hex) {
            return new Color.RGB(( hex >> 16 ) & 0xFF, ( hex >> 8 ) & 0xFF, hex & 0xFF);
        },

        calculateColorDistance: function (color1, color2) {

            color1 = Color.parse(color1);
            color2 = Color.parse(color2);

            var l1 = color1.toLAB(),
                l2 = color2.toLAB();

            return Math.sqrt(Math.pow(l2.l - l1.l, 2) + Math.pow(l2.a - l1.a, 2) + Math.pow(l2.b - l1.b, 2));
        }
    });

    Color.RGB = Color.inherit("js.type.Color.RGB", {

        ctor: function (r, g, b) {
            this.r = r || 0;
            this.g = g || 0;
            this.b = b || 0;
        },

        toRGB: function () {
            return this;
        },

        toHSB: function () {
            var r = this.r / 255;
            var g = this.g / 255;
            var b = this.b / 255;

            var h = 0,
                s = 0,
                v;

            var x, y;

            if (r >= g) {
                x = r;
            }
            else {
                x = g;
            }

            if (b > x) {
                x = b;
            }

            if (r <= g) {
                y = r;
            }
            else {
                y = g;
            }

            if (b < y) {
                y = b;
            }

            v = x;

            var c = x - y;

            if (x == 0) {
                s = 0;
            }
            else {
                s = c / x;
            }

            if (s != 0) {
                if (r == x) {
                    h = (g - b) / c;
                }
                else {
                    if (g == x) {
                        h = 2 + (b - r) / c;
                    }
                    else {
                        if (b == x) {
                            h = 4 + (r - g) / c;
                        }
                    }
                }
                h = h * 60;

                if (h < 0) {
                    h = h + 360;
                }
            }

            return new Color.HSB(h, s * 100, v * 100);
        },

        toXYZ: function () {
            var r = this.r / 255;
            var g = this.g / 255;
            var b = this.b / 255;

            if (r > 0.04045) {
                r = Math.pow((r + 0.055) / 1.055, 2.4);
            } else {
                r = r / 12.92;
            }

            if (g > 0.04045) {
                g = Math.pow((g + 0.055) / 1.055, 2.4);
            } else {
                g = g / 12.92;
            }

            if (b > 0.04045) {
                b = Math.pow((b + 0.055) / 1.055, 2.4);
            } else {
                b = b / 12.92;
            }

            r = r * 100;
            g = g * 100;
            b = b * 100;

            return new Color.XYZ(r * 0.4124 + g * 0.3576 + b * 0.1805,
                r * 0.2126 + g * 0.7152 + b * 0.0722,
                r * 0.0193 + g * 0.1192 + b * 0.9505);

        },

        toLAB: function () {
            return this.toXYZ().toLAB();
        },

        toHex: function () {
            return ( this.r << 16 ) | ( this.g << 8 ) | this.b;
        },

        invert: function () {
            return new Color.RGB(255 - this.r, 255 - this.g, 255 - this.b);
        },

        toString: function () {
            return "#" + this.toHexString();
        },

        toHexString: function() {

            return ("0" + this.r.toString(16)).right(2) +
                ("0" + this.g.toString(16)).right(2) +
                ("0" + this.b.toString(16)).right(2);

        },


        clone: function () {
            return new this.factory(this.r,this.g,this.b);
        }

    });

    Color.HSB = Color.inherit("js.type.Color.HSB", {

        ctor: function (h, s, b) {
            this.h = h || 0;
            this.s = s || 0;
            this.b = b || 0;
        },

        toRGB: function () {
            var r = 0, g = 0, bl = 0;
            var i, x, y, z;
            var h = this.h / 60,
                s = this.s / 100,
                b = this.b / 100;

            i = h >> 0;

            x = b * (1 - s);
            y = b * (1 - s * (h - i));
            z = b * (1 - s * (1 - h + i));

            switch (i) {
                case 0:
                    r = b;
                    g = z;
                    bl = x;
                    break;
                case 1:
                    r = y;
                    g = b;
                    bl = x;
                    break;
                case 2:
                    r = x;
                    g = b;
                    bl = z;
                    break;
                case 3:
                    r = x;
                    g = y;
                    bl = b;
                    break;
                case 4:
                    r = z;
                    g = x;
                    bl = b;
                    break;
                case 5:
                    r = b;
                    g = x;
                    bl = y;
                    break;

            }

            return new Color.RGB(r * 255 >> 0, g * 255 >> 0, bl * 255 >> 0);
        },

        toXZY: function () {
            return this.toRGB().toXZY();
        },

        toLAB: function () {
            return this.toRGB().toLAB();
        },
        toHSB: function () {
            return this;
        },

        toString: function() {
            return this.toRGB().toString();
        },

        toHexString: function () {
            return this.toRGB().toHexString();
        },

        clone: function () {
            return new this.factory(this.h, this.s, this.b);
        }

    });

    Color.XYZ = Color.inherit("js.type.Color.XYZ", {

        ctor: function (x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        },

        toLAB: function () {
            var REF_X = 95.047,
                REF_Y = 100.000,
                REF_Z = 108.883;

            var x = this.x / REF_X,
                y = this.y / REF_Y,
                z = this.z / REF_Z;

            if (x > 0.008856) {
                x = Math.pow(x, 1 / 3);
            } else {
                x = ( 7.787 * x ) + ( 16 / 116 );
            }

            if (y > 0.008856) {
                y = Math.pow(y, 1 / 3);
            } else {
                y = ( 7.787 * y ) + ( 16 / 116 );
            }

            if (z > 0.008856) {
                z = Math.pow(z, 1 / 3);
            } else {
                z = ( 7.787 * z ) + ( 16 / 116 );
            }

            return new Color.LAB(( 116 * y ) - 16, 500 * ( x - y ), 200 * ( y - z ));
        },
        toXYZ: function(){
            return this;
        },
        clone: function () {
            return new this.factory(this.x, this.y, this.z);
        }
    });

    Color.LAB = Color.inherit("js.type.Color.LAB", {
        ctor: function (l, a, b) {
            this.l = l;
            this.a = a;
            this.b = b;
        },
        clone: function () {
            return new this.factory(this.l, this.a, this.b);
        }
    });

    return Color;
});