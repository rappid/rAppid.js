var rAppid;

(function (exports, inherit, require, define, underscore) {

    if (!require) {
        throw "require.js is needed";
    }

    if (!define) {
        throw "define is needed";
    }

    if (!underscore) {
        // TODO include own implementation
        throw "underscore is needed"
    }

    require.config({
        paths: {
            "xaml": "js/plugins/xaml",
            "json": "js/plugins/json"
        }
    });

    var Base = inherit.Base.inherit({
        ctor: function () {
        }
    });


    // define js.core.Base
    define("js/core/Base", [], function() {
        return Base;
    });

    define("rAppid", function() {
        return _rAppid;
    });

    function SystemManager(applicationDomain, application) {
        this.applicationDomain = applicationDomain;
        this.application = application;
    }

    var xamlApplication = /^(xaml!)?(.+?)(\.xml)?$/;
    var defaultNamespaceMap = {
        "http://www.w3.org/1999/xhtml": "js.html"
    };

    var currentApplicationDomain = null;

    var _rAppid = {
        defineClass: function(fqName, dependencies, generateFactory){
            if (currentApplicationDomain) {
                currentApplicationDomain.defineClass(fqName, dependencies, generateFactory);
            } else {
                throw "CurrentApplicationDomain not available! Application not bootstrapped?";
            }
        },

        defineXamlClass: function(fqClassName, dependencies, factory) {
            if (currentApplicationDomain) {
                currentApplicationDomain.defineXamlClass(fqClassName, dependencies, factory);
            } else {
                throw "CurrentApplicationDomain not available! Application not bootstrapped?";
            }
        },

        bootStrap: function (mainClass, config, callback) {
            config = config || {};
            
            var internalBootstrap = function(config) {

                var xamlClasses = config.xamlClasses || [];
                var namespaceMap = config.namespaceMap || defaultNamespaceMap;
                var rewriteMap = config.rewriteMap;

                var applicationDomain = currentApplicationDomain = new ApplicationDomain(namespaceMap, rewriteMap);

                require.config({
                    xamlClasses: xamlClasses,
                    namespaceMap: namespaceMap,
                    rewriteMap: applicationDomain.$rewriteMap,
                    applicationDomain: applicationDomain
                });

                if (mainClass) {
                    var parts = xamlApplication.exec(mainClass);
                    if (parts) {
                        // mainClass is xaml
                        mainClass = "xaml!" + parts[2];
                    } else {
                        // mainClass is javascript factory
                        mainClass = mainClass.replace(/\./g, "/");
                    }

                    require(["js/core/Imports"], function () {
                        require(["js/core/Application", mainClass], function (Application, mainClassFactory) {
                            // create instance
                            var application = new mainClassFactory(null, false, applicationDomain, null, null);

                            if (application instanceof Application) {

                                var systemManager = new SystemManager(applicationDomain, application);
                                rAppid.systemManager = systemManager;

                                application.$config = config;
                                application._initialize("auto");

                                // return system manager
                                if (callback) {
                                    callback(null, systemManager, application);
                                }

                            } else {
                                var errMessage = "mainClass isn't an instance of js.core.Application";
                                if (callback) {
                                    callback(errMessage);
                                } else {
                                    throw(errMessage);
                                }
                            }
                        });
                    });
                }
            };
            
            if (Object.prototype.toString.call(config) == '[object String]') {
                require(["json!" + config], function(config) {
                    internalBootstrap(config);
                });
            } else {
                internalBootstrap(config);
            }

        },
        _: underscore
    };

    var Rewrite = _rAppid.rewriteMapEntry = function (from, to) {
        this.$from = from;
        this.$to = to;
    };

    _rAppid.defaultRewriteMap = [
        new Rewrite(/^js.html.(input)$/, "js.html.Input"),
        new Rewrite(/^js.html.(select)$/, "js.html.Select"),
        new Rewrite(/^js.html.(textarea)$/, "js.html.TextArea"),
        new Rewrite(/^js.html.(option)$/, "js.html.Option"),
        new Rewrite(/^js.html.(.+)$/, "js.html.DomElement"),
        new Rewrite(/^js.conf.(.+)$/, "js.core.Component")
    ];

    var ApplicationDomain = inherit.Base.inherit({
        ctor: function(namespaceMap, rewriteMap) {
            this.$namespaceMap = namespaceMap || {};
            this.$rewriteMap = rewriteMap || rAppid.defaultRewriteMap;
            this.$ns = {};
        },
        /**
         *
         * loads all dependencies and defines a class under the given fqClassname
         *
         * @param fqClassName full qualified classname (e.g. js.ui.myComponent)
         * @param dependencies as hash or array
         * @param generateFactor a function that return the factory function invoked after all dependencies are loaded
         */
        defineClass: function (fqClassName, dependencies, generateFactor) {
            // create the namespace and install the class
            if (!fqClassName || fqClassName == "") {
                throw "Full qualified class name '" + fqClassName + "' in wrong format. Use dot notation.";
            }

            var self = this;
            var realDependencies = [];

            if (dependencies) {
                for (var i = 0; i < dependencies.length; i++) {
                    realDependencies.push(dependencies[i].replace(/\./g, "/"));
                }
            }

            define(fqClassName.replace(/\./g, "/"), realDependencies, function () {

                var factory = generateFactor.apply(this, arguments);
                factory.prototype.constructor.name = fqClassName;

                if (!self.installClass(self.$ns, fqClassName.split("."), factory)) {
                    throw "Class '" + fqClassName + "' could not be installed";
                }

                return factory;
            });

        },

        /**
         * registers an XAML component
         *
         * differs from normal class registration because, dependencies are loaded
         * and class has to be installed immedently
         *
         * @param fqClassName
         * @param dependencies
         * @param factory
         */
        defineXamlClass: function (fqClassName, dependencies, factory) {
            // create the namespace and install the class
            if (!fqClassName || fqClassName == "") {
                throw "Full qualified class name '" + fqClassName + "' in wrong format. Use dot notation.";
            }

            var normalizeRegex = /\//g;

            fqClassName = fqClassName.replace(normalizeRegex, ".");
            factory.prototype.constructor.name = fqClassName;

            if (!this.installClass(this.$ns, fqClassName.split("."), factory)) {
                throw "Class '" + fqClassName + "' could not be installed";
            }

            define(fqClassName.replace(/\./g, "/"), dependencies, function () {
                return factory;
            });

        },

        getDefinition: function (fqClassName) {

            function getDefinition (currentNamespace, classPath) {

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
                            return getDefinition.call(this, currentNamespace[part], classPath);
                        }
                    }
                }

                return null;
            }

            return getDefinition.call(this, this.$ns, fqClassName.split("."));
        },
        hasDefinition: function (fqClassName) {
            return this.getDefinition(fqClassName) ? true : false;
        },

        createInstance: function (fqClassName, args, className) {

            className = className || fqClassName;
            args = args || [];

            var classDefinition = this.getDefinition(fqClassName);

            function construct(constructor, args) {
                function F() {
                    return constructor.apply(this, args);
                }

                F.prototype = constructor.prototype;
                return new F();
            }

            var ret = construct(classDefinition, args);
            ret.className = className;

            return ret;
        },
        getFqClassName: function (namespace, className, useRewriteMap) {
            if (useRewriteMap == undefined || useRewriteMap == null) {
                useRewriteMap = true;
            }

            var fqClassName = [this.$namespaceMap[namespace] || namespace, className].join(".");

            if (useRewriteMap) {
                for (var i = 0; i < this.$rewriteMap.length; i++) {
                    var entry = this.$rewriteMap[i];
                    if (entry instanceof rAppid.rewriteMapEntry) {
                        if (entry.$from.test(fqClassName)) {
                            return fqClassName.replace(entry.$from, entry.$to);
                        }
                    }
                }
            }

            return fqClassName;
        },

        installClass: function (currentNamespace, path, value) {

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
            return this.installClass(currentNamespace[part], path, value);
        }
    });

    rAppid = exports.rAppid = _rAppid;

})(typeof exports === "undefined" ? this : exports,
   typeof inherit === "undefined" ? global.inherit : inherit,
    requirejs,
    requirejs.define ? requirejs.define : define,
    typeof this._ === "undefined" ? global.underscore : this._);
