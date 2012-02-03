define("js/core/ApplicationDomain", [], function(){

    var ApplicationDomain = js.core.Base.inherit({
        ctor: function (parentDomain, globalClassRegistrationRoot, namespaceMap) {
            this.base.ctor.callBase(this);

            this.$ns = {};
            this.$parentDomain = parentDomain;
            this.$globalClassRegistrationRoot = globalClassRegistrationRoot;
            this.$namespaceMap = namespaceMap || {};
        },
        /**
         *
         * loads all dependencies and defines a class under the given fqClassname
         *
         * @param fqClassname full qualified classname (e.g. js.ui.myComponent)
         * @param dependencies as hash or array
         * @param generateFactor a function that return the factory function invoked after all dependencies are loaded
         */
        defineClass: function (fqClassname, dependencies, generateFactor) {
            // create the namespace and install the class
            if (!fqClassname || fqClassname == "") {
                throw "Full qualified class name '" + fqClassname + "' in wrong format. Use dot notation.";
            }

            var self = this;
            var realDependencies = [];

            if (dependencies) {
                for (var i = 0; i < dependencies.length; i++) {
                    realDependencies.push(dependencies[i].replace(/\./g, "/"));
                }
            }

            define(fqClassname.replace(/\./g, "/"), realDependencies, function () {
                var factory = generateFactor.apply(this, arguments);

                if (ApplicationDomain.installClass(self.$ns, fqClassname.split("."), factory)) {
                    if (self.$globalClassRegistrationRoot) {
                        // install class factory in the globalClassRegistration
                        if (!(ApplicationDomain.installClass(self.$globalClassRegistrationRoot, fqClassname.split("."), factory))) {
                            throw "Class '" + fqClassname + "' could not be installed in the global class registration";
                        }
                    }
                } else {
                    throw "Class '" + fqClassname + "' could not be installed";
                }

                return factory;
            });

        },

        getParentDomain: function () {
            return this.$parentDomain;
        },
        getDefinition: function (fqClassName) {

            var ret = js.core.ApplicationDomain.getDefinition.call(this, this.$ns, fqClassName.split("."));

            if (!ret) {
                var parentDomain = this.getParentDomain();
                if (parentDomain) {
                    ret = parentDomain.getDefinition(fqClassName);
                }
            }

            if (!ret) {
                console.log(fqClassName);
            }

            return ret;
        },
        hasDefinition: function (fqClassName) {
            return this.getDefinition(fqClassName) ? true : false;
        },
        createInstance: function (fqClassName, args) {
            args = args || [];
            var classDefinition = this.getDefinition(fqClassName);
            if (!classDefinition && this.getParentDomain()) {
                return this.getParentDomain().createInstance(fqClassName, args);
            }

            function construct(constructor, args) {
                function F() {
                    return constructor.apply(this, args);
                }

                F.prototype = constructor.prototype;
                return new F();
            }

            return construct(classDefinition, args);
        },
        getFqClassName: function (namespace, className) {
            return [this.$namespaceMap[namespace] || namespace, className].join(".");
        }
    });

    ApplicationDomain.getDefinition = function (currentNamespace, classPath) {

        if (classPath.length > 0) {
            var part = classPath.shift();
            if (currentNamespace.hasOwnProperty(part)) {
                var value = currentNamespace[part];

                if (value instanceof Function) {
                    if (classPath.length == 0) {
                        return value;
                    } else {
                        throw "unterminated classpath";
                    }
                } else {
                    return ApplicationDomain.getDefinition.call(this, currentNamespace[part], classPath);
                }
            }
        }

        return null;
    };

    ApplicationDomain.installClass = function (currentNamespace, path, value) {

        if (path.length == 0) {
            return false;
        }

        var part = path.shift();

        if (!currentNamespace.hasOwnProperty(part)) {
            if (path.length == 0) {
                // create class
                currentNamespace[part] = value;
                return true;
            } else {
                // create namespace
                currentNamespace[part] = {};
            }
        }

        // step into namespace
        return ApplicationDomain.installClass(currentNamespace[part], path, value);
    };

    ApplicationDomain.currentDomain = null;

    return ApplicationDomain;
});
