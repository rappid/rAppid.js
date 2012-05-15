var rAppid;

/** ECMA SCRIPT COMPLIANT**/
if(!String.prototype.trim){
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    };
}

if(!console){
    var console = {
        log : function(){},
        warn: function(){}
    }
}

(function (exports, inherit, requirejs, define, underscore, XMLHttpRequest, flow, document) {

    if (!requirejs) {
        throw "require.js is needed";
    }

    if (!define) {
        throw "define is needed";
    }

    if (!underscore) {
        throw "underscore is needed"
    }

    if (!flow) {
        throw "flow.js is needed";
    }

    /***
     * marks a function to be executed asycn
     * @return {*}
     */
    Function.prototype.async = function () {
        this._async = true;
        return this;
    };

    // global requirejs setup
    requirejs.config({
        paths: {
            "xaml": "js/plugins/xaml",
            "json": "js/plugins/json"
        }
    });

    var xamlApplication = /^(xaml!)?(.+?)(\.xml)?$/;

    var Rewrite = function (from, to) {
            this.$from = from;
            this.$to = to;
        },
        defaultNamespaceMap = {
            "http://www.w3.org/1999/xhtml": "js.html"
        },
        defaultRewriteMap = [
            new Rewrite(/^js\/html\/(a)$/, "js/html/a"),
            new Rewrite(/^js\/html\/(input)$/, "js/html/Input"),
            new Rewrite(/^js\/html\/(select)$/, "js/html/Select"),
            new Rewrite(/^js\/html\/(textarea)$/, "js/html/TextArea"),
            new Rewrite(/^js\/html\/(option)$/, "js/html/Option"),
            new Rewrite(/^js\/html\/(.+)$/, "js/html/DomElement")
        ];

    var _rAppid = {

        createApplicationContext: function(applicationDomain, mainClass, config, callback) {

            config = config || {};

            var internalCreateApplicationContext = function (config) {

                config.xamlClasses = config.xamlClasses || [];
                config.namespaceMap = config.namespaceMap || defaultNamespaceMap;
                config.rewriteMap = config.rewriteMap || defaultRewriteMap;

                define("flow", function () {
                    return flow;
                });

                define("flow.js", function () {
                    return flow;
                });

                define("inherit", function () {
                    return inherit;
                });

                define("underscore", function() {
                    return underscore;
                });

                underscore.extend(config, {
                    paths: {
                        "xaml": "js/plugins/xaml",
                        "json": "js/plugins/json"
                    }
                });

                // and add it to config object, so it can used from xaml.js
                config.applicationDomain = applicationDomain;

                var requirejsContext = requirejs.config(config);

                var applicationContext = new ApplicationContext(requirejsContext, config);
                //applicationContext.document = document;

                define("rAppid", function () {
                    return applicationContext;
                });


                if (mainClass) {
                    //TODO: have a look at xamlClasses
                    var parts = xamlApplication.exec(mainClass);
                    if (parts) {
                        // mainClass is xaml
                        mainClass = "xaml!" + parts[2];
                    } else {
                        // mainClass is javascript factory
                        mainClass = mainClass.replace(/\./g, "/");
                    }

                    requirejsContext(["require"], function () {
                        requirejsContext([mainClass], function (applicationFactory) {
                            applicationContext.$applicationFactory = applicationFactory;
                            callback(null, applicationContext);
                        });
                    });

                } else {
                    callback(null, applicationContext);
                }

            };

            if (Object.prototype.toString.call(config) == '[object String]') {
                requirejs(["json!" + config], function (config) {
                    internalCreateApplicationContext(config);
                });
            } else {
                internalCreateApplicationContext(config);
            }

        },

        bootStrap: function (mainClass, config, callback) {
            _rAppid.createApplicationContext(null, mainClass, config, function(err, applicationContext){
                if (err || !applicationContext) {
                    callback(err || "ApplicationContext missing");
                } else {
                    applicationContext.createApplicationInstance(document, callback);
                }
            })
        },

        rewriteMapEntry: Rewrite,

        createQueryString: function(parameter) {
            var ret = [];

            for (var key in parameter) {
                if (parameter.hasOwnProperty(key)) {
                    ret.push(encodeURIComponent(key) + "=" + encodeURIComponent(parameter[key]));
                }
            }

            return ret.join("&");
        },

        ajax: function(url, options, callback) {

            var s = {
                url: url
            };

            underscore.extend(s, options, _rAppid.ajaxSettings);

            if (s.data && !underscore.isString(s.data)) {
                throw "data must be a string";
            }

            s.hasContent = !/^(?:GET|HEAD)$/.test(s.type);
            
            if (s.queryParameter && underscore.keys(s.queryParameter).length > 0) {
                // append query parameter to url
                s.url += /\?/.test(s.url) ? "&" : "?" + this.createQueryString(s.queryParameter);
            }

            if (s.data && s.hasContent && s.contentType !== false) {
                xhr.setRequestHeader("Content-Type", s.contentType);
            }

            // create new xhr
            var xhr = s.xhr();
            xhr.open(s.type, s.url, s.async);

            try {
                for (var header in s.headers) {
                    if (s.headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header, s.headers[header]);
                    }
                }
            } catch (e) {} // FF3

            xhr.send();

            var xhrCallback = function(_, isAbort) {

                var wrappedXhr;

                if (xhrCallback && (isAbort || xhr.readyState === 4)) {
                    xhrCallback = undefined;

                    if (isAbort) {
                        // Abort it manually if needed
                        if (xhr.readyState !== 4) {
                            xhr.abort();
                        }
                    } else {
                        wrappedXhr = new rAppidXhr(xhr);
                    }

                    if (callback) {
                        callback(isAbort, wrappedXhr)
                    }
                }
            };

            if (!s.async || xhr.readyState === 4) {
                xhrCallback();
            } else {
                xhr.onreadystatechange = xhrCallback
            }

            return xhr;
        }
    };

    var rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg; // IE leaves an \r character at EOL

    var rAppidXhr = inherit.Base.inherit({
        ctor: function(xhr) {
            this.xhr = xhr;
            this.status = xhr.status;
            this.$nativeResponseHeaders = xhr.getAllResponseHeaders();
            this.responses = {};

            var xml = xhr.responseXML;

            // Construct response list
            if (xml && xml.documentElement) {
                this.responses.xml = xml;
            }
            this.responses.text = xhr.responseText;

            try {
                this.statusText = xhr.statusText;
            } catch (e) {
                this.statusText = "";
            }
        },
        getResponseHeader: function(key) {
            var match;
            if (!this.$responseHeaders) {
                this.$responseHeaders = {};
                while (( match = rheaders.exec(this.$nativeResponseHeaders) )) {
                    this.$responseHeaders[match[1].toLowerCase()] = match[2];
                }
            }
            return this.$responseHeaders[key.toLowerCase()];
        }

    });

    _rAppid.ajaxSettings = {
        type: "GET",
        contentType: "application/x-www-form-urlencoded",
        async: true,
        // TODO: add ie7 support for local file requests via ActiveX
        xhr: function() {
            return new XMLHttpRequest();
        },
        headers: {
        }
    };

    var SystemManager = _rAppid.SystemManager = inherit.Base.inherit({
        ctor: function (requirejsContext, applicationContext, document) {
            this.$requirejsContext = requirejsContext;
            this.$applicationContext = applicationContext;
            this.$applicationFactory = null;
            this.$document = document;
        }
    });

    var ApplicationContext = _rAppid.ApplicationContext = SystemManager.inherit({

        ctor: function(requirejsContext, config) {
            this.callBase(requirejsContext);
            this.$config = config;
            this.$applicationContext = this;
        },

        createApplicationInstance: function(document, callback) {
            // create instance
            var applicationFactory = this.$applicationFactory;

            var systemManager = new SystemManager(this.$requirejsContext, this, document);

            this.$requirejsContext(["js/core/Application"], function(Application) {

                var application = new applicationFactory(null, false, systemManager, null, null);

                if (application instanceof Application) {

                    systemManager.$application = application;

                    application._initialize("auto");

                    // return rAppid instance
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

        },

        getFqClassName: function (namespace, className, useRewriteMap) {
            if (useRewriteMap == undefined || useRewriteMap == null) {
                useRewriteMap = true;
            }

            if (namespace && className) {
                namespace = (this.$config.namespaceMap[namespace] || namespace).replace(/\./g, '/');
                var fqClassName = [namespace, className].join("/");
            } else {
                fqClassName = (namespace || className).replace(/\./g, '/');
            }

            if (underscore.indexOf(this.$config.xamlClasses, fqClassName) !== -1) {
                fqClassName = 'xaml!'+ fqClassName;
            }

            if (useRewriteMap) {
                for (var i = 0; i < this.$config.rewriteMap.length; i++) {
                    var entry = this.$config.rewriteMap[i];
                    if (entry instanceof rAppid.rewriteMapEntry) {
                        if (entry.$from.test(fqClassName)) {
                            return fqClassName.replace(entry.$from, entry.$to);
                        }
                    }
                }
            }

            return fqClassName;
        },

        createInstance: function (fqClassName, args, className) {
            className = className || fqClassName;
            args = args || [];

            fqClassName = fqClassName.replace(/\./g, "/");

            var classDefinition = this.$requirejsContext(fqClassName);

            function construct(constructor, args) {
                function F() {
                    return constructor.apply(this, args);
                }

                F.prototype = constructor.prototype;
                return new F();
            }

            var ret;
            try {
                ret = construct(classDefinition, args);
                ret.className = className;
            } catch (e) {
                console.log("Cannot create instance of '" + fqClassName + "'");
            }

            return ret;
        },

        ajax: function(url, options, callback) {

            if (!(/^http.*$/.test(url)) && this.$config.applicationUrl) {
                url = this.$config.applicationUrl + '/' + url;
            }

            _rAppid.ajax(url, options, callback);
        }

    });


    rAppid = exports.rAppid = _rAppid;
    exports.defaultNamespaceMap = defaultNamespaceMap;
    exports.defaultRewriteMap = defaultRewriteMap;
    exports.SystemManager = SystemManager;
    exports.ApplicationContext = ApplicationContext;


})(typeof exports === "undefined" ? this : exports,
   typeof inherit === "undefined" ? require('inherit.js').inherit : inherit,
    typeof requirejs === "undefined" ? require('requirejs') : requirejs,
    typeof requirejs === "undefined" ? require('requirejs').define : define,
    typeof this._ === "undefined" ? require('underscore') : this._,
    typeof window === "undefined" ? require('xmlhttprequest').XMLHttpRequest : window.XMLHttpRequest,
    typeof flow === "undefined" ? require('flow.js').flow : flow,
    typeof document === "undefined" ? (new (require('xmldom').DOMParser)()) : document);
