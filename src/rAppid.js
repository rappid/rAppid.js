var rAppid;

(function (global, exports, inherit, require) {

    global.js = global.js || {};
    global.js.core = global.js.core || {};

    var Base = inherit.Base.inherit({
        ctor: function () {
        }
    });

    // maybe we later need a own BaseClass
    global.js.core.Base = Base;

    // define js.core.Base
    define("js.core.Base", [], function() {
        return Base;
    });

    function SystemManager(applicationDomain, application) {
        this.applicationDomain = applicationDomain;
        this.application = application;
    }

    var xamlApplication = /^(xaml!)?(.+?)(\.xml)?$/;
    var defaultNamespaceMap = {
        "http://www.w3.org/1999/xhtml": "js.html"
    };

    var _rAppid = {
        defineClass: function(fqName, dependencies, generateFactory){
            if (global.js.core.ApplicationDomain.currentDomain) {
                global.js.core.ApplicationDomain.currentDomain.defineClass(fqName, dependencies, generateFactory);
            } else {
                throw "ApplicationDomain not available! Application not bootstrapped?";
            }
        },

        defineXamlClass: function(fqClassName, dependencies, factory) {
            if (global.js.core.ApplicationDomain.currentDomain) {
                global.js.core.ApplicationDomain.currentDomain.defineXamlClass(fqClassName, dependencies, factory);
            } else {
                throw "ApplicationDomain not available! Application not bootstrapped?";
            }
        },

        bootStrap: function (mainClass, xamlClasses, callback, namespaceMap, rewriteMap) {
            mainClass = mainClass || "app.xml";
            xamlClasses = xamlClasses || [];
            namespaceMap = namespaceMap || defaultNamespaceMap;

            var parts = xamlApplication.exec(mainClass);
            if (parts) {
                // mainClass is xaml
                mainClass = "xaml!" + parts[2];
            } else {
                // mainClass is javascript factory
                mainClass = mainClass.replace(/\./g, "/");
            }

            if (!require) {
                throw "require.js is needed";
            }

            // TODO: automatic detect xaml or js -> default load plugin for require has to overwritten

            require(["js/core/ApplicationDomain"], function (ApplicationDomain) {

                var applicationDomain = new ApplicationDomain(null, global, namespaceMap, rewriteMap);

                require.config({
                    xamlClasses: xamlClasses,
                    namespaceMap: namespaceMap,
                    rewriteMap: applicationDomain.$rewriteMap,
                    rAppid: _rAppid
                });


                global.js.core.ApplicationDomain = ApplicationDomain;
                ApplicationDomain.currentDomain = applicationDomain;


                require([mainClass], function(mainClassFactory) {
                    // create instance
                    var application = new mainClassFactory();

                    if (application instanceof global.js.core.Application) {

                        application._construct(application._$descriptor, applicationDomain, null, application);
                        application._initialize("auto");

                        // return system manager
                        if (callback) {
                            callback(null, new SystemManager(applicationDomain, application), application);
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

    rAppid = exports.rAppid = _rAppid;

})(this, typeof exports === "undefined" ? this : exports, inherit, require);
