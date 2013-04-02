define([], function () {

    var round = Math.round;

    Math.round = function (value, digits) {
        if (digits) {
            var pow = Math.pow(10, digits);
            return round(value * pow) / pow;
        }
        return round(value);
    };

    if (!Date.now) {
        Date.now = function now() {
            return +(new Date);
        };
    }

    if (typeof window !== "undefined" && !window.getComputedStyle) {
        window.getComputedStyle = function (el) {
            this.el = el;
            this.getPropertyValue = function (prop) {
                var re = /(\-([a-z]){1})/g;
                if (prop == 'float') {
                    prop = 'styleFloat';
                }

                if (re.test(prop)) {
                    prop = prop.replace(re, function () {
                        return arguments[2].toUpperCase();
                    });
                }
                return el.currentStyle[prop] ? el.currentStyle[prop] : null;
            };

            return this;
        }
    }


    return true;
});