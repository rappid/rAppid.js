var inherit;

(function (global, exports) {

    /**
     *
     * @param {String} [constructorName] The name of the constructor
     * @param {Object} classDefinition The definition for the prototype methods
     * @param {Object} [staticDefinition] The definition for the prototype methods
     * @param {Function} [baseClass] The prototype to inherit from
     *
     * @return {Function} returns a constructor function describing the class
     */
    inherit = function (constructorName, classDefinition, staticDefinition, baseClass) {

        var args = Array.prototype.slice.call(arguments);

        if (args[0] instanceof Object) {
            args.unshift(null);
        }

        if (args[2] instanceof Function) {
            args.splice(2, 0, null);
        }

        constructorName = args[0];
        classDefinition = args[1] || {};
        staticDefinition = args[2] || {};
        baseClass = args[3] || Object;

        var newClass = function () {
            if (this.ctor) {
                return this.ctor.apply(this, arguments);
            }
        };

        if (baseClass.constructor instanceof Function) {

            function Inheritance() {
            }

            Inheritance.prototype = baseClass.prototype;

            newClass.prototype = new Inheritance();
            newClass.prototype.constructor = {
                name: constructorName
            };

            newClass.prototype.base = baseClass.prototype;
            newClass.prototype.factory = newClass;

        } else {
            newClass.prototype = baseClass;
            newClass.prototype.constructor = classDefinition;
            newClass.prototype.base = baseClass;
        }

        for (var publicMethod in classDefinition) {
            if (classDefinition.hasOwnProperty(publicMethod)) {
                var baseFunction = newClass.prototype[publicMethod];
                newClass.prototype[publicMethod] = classDefinition[publicMethod];

                if (baseFunction instanceof Function) {
                    newClass.prototype[publicMethod].baseImplementation = baseFunction;
                }
            }
        }

        for (var staticMethod in staticDefinition) {
            if (staticDefinition.hasOwnProperty(staticMethod)) {
                newClass[staticMethod] = staticDefinition[staticMethod];
            }
        }

        newClass.prototype.callBase = inherit.callBase;

        return newClass;

    };

    inherit.callBase = function () {
        // get arguments
        var args = Array.prototype.slice.call(arguments);

        if (args.length === 0) {
            // use arguments from call
            args = Array.prototype.slice.call(arguments.callee.caller.arguments);
        }

        return arguments.callee.caller.baseImplementation.apply(this, args);
    };



    /***
     *
     * @param {String} [constructorName]
     * @param {Object} classDefinition The definition for the prototype methods
     * @param {Object} [staticDefinition]
     * @return {Function} returns a constructor function describing the class
     */
    Function.prototype.inherit = function (constructorName, classDefinition, staticDefinition) {

        var args = Array.prototype.slice.call(arguments);

        if (args[0] instanceof Object) {
            args.unshift(null);
        }

        return inherit(args[0], args[1], args[2], this);
    };

    Function.prototype.callBase = function () {
        var args = Array.prototype.slice.call(arguments);
        var that = args.shift();

        if (that && that.base) {
            var caller = arguments.callee.caller;

            if (this == caller) {
                return this.baseImplementation.apply(that, args);
            } else {
                return this.apply(that, args);
            }
        } else {
            throw "base not definied";
        }
    };

    Function.prototype.classof = function(factory) {
        if (!factory) {
            return false;
        }

        if (!(factory instanceof Function)) {
            throw new Error("factory must be a function");
        }

        return (factory === this || this.prototype instanceof factory);
    };

    /**
     * @property {Function} base class
     */
    inherit.Base = inherit({
        ctor: function () {
        }
    });

    exports.inherit = inherit;

})(this, typeof exports === "undefined" ? this : exports);

