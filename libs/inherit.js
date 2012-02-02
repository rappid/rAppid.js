
var inherit;
(function (global, exports) {

    inherit = function(classDefinition, baseClass) {
        baseClass = baseClass || Object;

        var newClass = function() {
            if (this.ctor) {
                this.ctor.apply(this, arguments);
            }
        };

        if (baseClass.constructor == Function) {

            function Inheritance(){}
            Inheritance.prototype = baseClass.prototype;

            newClass.prototype = new Inheritance();
            newClass.prototype.constructor = classDefinition;
            newClass.prototype.base = baseClass.prototype;

        } else {
            newClass.prototype = baseClass;
            newClass.prototype.constructor = classDefinition;
            newClass.prototype.base = baseClass;
        }

        for (var publicMethod in classDefinition) {
            if (classDefinition.hasOwnProperty(publicMethod)) {
                newClass.prototype[publicMethod] = classDefinition[publicMethod];
            }
        }

        return newClass;

    };

    Function.prototype.inherit = function(classDefinition) {
        return inherit(classDefinition, this);
    };

    Function.prototype.callBase = function() {
        var args = Array.prototype.slice.call(arguments);
        var that = args.shift();

        if (that && that.base) {
            var originalBase = that.base;
            that.base = that.base.base;
            var ret = this.apply(that, args);
            that.base = originalBase;

            return ret;
        } else {
            throw "base not definied";
        }
    };

    inherit.Base = inherit({
        ctor: function(){}
    });

    exports.inherit = inherit;

})(this, typeof exports === "undefined" ? this : exports);