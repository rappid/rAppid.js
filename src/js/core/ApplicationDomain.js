define("js/core/ApplicationDomain", [],
    /**
     * @exports js.core.ApplicationDomain
     */
        function () {


        /**
         * @class js.core.ApplicationDomain
         * @extends js.core.Base
         */
        var ApplicationDomain = js.core.Base.inherit({
            /**
             *
             * @param {js.core.ApplicationDomain} parentDomain
             * @param {Object} globalClassRegistrationRoot The global registration for classes
             * @param {Object} [namespaceMap] Mapping namespaces to uris
             * @param {Object} [rewriteMap] Maps fqNames to different fqNames e.g. js.html.div -> js.html.DomElement
             */
            ctor: function (parentDomain, globalClassRegistrationRoot, namespaceMap, rewriteMap) {
                this.base.ctor.callBase(this);

                this.$ns = {};
                this.$parentDomain = parentDomain;
                this.$globalClassRegistrationRoot = globalClassRegistrationRoot;
                this.$namespaceMap = namespaceMap || {};
                this.$rewriteMap = rewriteMap || ApplicationDomain.defaultRewriteMap;
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

                    factory.prototype.constructor.name = fqClassname;

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
                var fqClassName = [this.$namespaceMap[namespace] || namespace, className].join(".");

                for (var i = 0; i < this.$rewriteMap.length; i++) {
                    var entry = this.$rewriteMap[i];
                    if (entry instanceof ApplicationDomain.rewriteMapEntry) {
                        if (entry.$from.test(fqClassName)) {
                            return fqClassName.replace(entry.$from, entry.$to);
                        }
                    }
                }

                return fqClassName;
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

        var rewrite = ApplicationDomain.rewriteMapEntry = function(from, to) {
            this.$from = from;
            this.$to = to;
        };

        ApplicationDomain.defaultRewriteMap = [
            new rewrite(/^js.html.(.+)$/, "js.html.DomElement")
        ];


        return ApplicationDomain;
    });
