(function (exports, requirejs, define, window, XMLHttpRequest) {
    /** ECMA SCRIPT COMPLIANT**/
    if (!String.prototype.trim) {
        String.prototype.trim = function () {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    var underscore,
        Stage,
        document = window.document; // TODO: create workaround for node


    /***
     * marks a function to be executed asycn
     * @return {*}
     */
    Function.prototype.async = function () {
        this._async = true;
        return this;
    };

    var xamlApplication = /^(xaml!)?(.+?)(\.xml)?$/;

    var Rewrite = function (from, to) {
            this.$from = from;
            this.$to = to;
        },
        defaultNamespaceMap = {
            "http://www.w3.org/1999/xhtml": "js.html",
            "http://www.w3.org/2000/svg": "js.svg"
        },
        defaultRewriteMap = [
            new Rewrite(/^js\/html\/(a)$/, "js/html/a"),
            new Rewrite(/^js\/html\/(input)$/, "js/html/Input"),
            new Rewrite(/^js\/html\/(select)$/, "js/html/Select"),
            new Rewrite(/^js\/html\/(textarea)$/, "js/html/TextArea"),
            new Rewrite(/^js\/html\/(option)$/, "js/html/Option"),
            new Rewrite(/^js\/html\/(.+)$/, "js/html/HtmlElement"),

            new Rewrite(/^js\/svg\/svg$/, "js/svg/Svg"),
            new Rewrite(/^js\/svg\/(.+)$/, "js/svg/SvgElement")
        ];

    if (typeof JSON !== "undefined") {
        define("JSON", function () {
            return JSON;
        });
    } else {
        requirejs.config({
            paths: {
                JSON: "js/lib/json2"
            },
            shim: {
                JSON: {
                    exports: "JSON"
                }
            }
        });
    }

    requirejs.config({
        paths: {
            json: "js/plugin/json"
        }
    });

    var rAppid = {

        createApplicationContext: function (mainClass, config, callback) {

            config = config || {};

            var internalCreateApplicationContext = function (config) {

                config.xamlClasses = config.xamlClasses || [];
                config.namespaceMap = config.namespaceMap || defaultNamespaceMap;
                config.rewriteMap = config.rewriteMap || defaultRewriteMap;

                var requirejsContext = requirejs.config(config),
                    applicationContext = new ApplicationContext(requirejsContext, config);

                define("applicationContext", function () {
                    return applicationContext;
                });

                if (typeof JSON !== "undefined") {
                    define("JSON", function () {
                        return JSON;
                    });
                }

                requirejsContext(["inherit", "underscore", "js/core/Stage"], function (inherit, _, s) {
                    // we have to load inherit.js in order that inheritance is working
                    underscore = _;
                    Stage = s;

                    if (inherit && _) {

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

                            requirejsContext([mainClass], function (applicationFactory) {
                                applicationContext.$applicationFactory = applicationFactory;
                                callback(null, applicationContext);
                            }, function (err) {
                                callback(err);
                            });
                        } else {
                            callback(null, applicationContext);
                        }

                    } else {
                        callback("inherit or underscore missing");
                    }
                });

            };

            if (Object.prototype.toString.call(config) == '[object String]') {
                requirejs(["json!" + config], function (config) {
                    internalCreateApplicationContext(config);
                });
            } else {
                internalCreateApplicationContext(config);
            }

        },

        /***
         *
         * @param {js.core.Application} mainClass the application main class to load and start
         * @param {Element} [target=document.body] the target where the application is rendered
         * @param {Object} [parameter] an object defining the parameters passed to the Application.start method
         * @param {String|Object} [config=config.json] filename of the config file to load or configuration object
         * @param {Function} [callback] callback function in the form <code>function (err, systemManager, application)</code>
         */
        bootStrap: function (mainClass, target, parameter, config, callback) {

            parameter = parameter || {};

            if (typeof window !== 'undefined' && window.location && !parameter.initialHash) {
                var param = window.location.search.replace(/^\?/, '').split('&');
                for (var i = 0; i < param.length; i++) {
                    var result = /^([^=]+)=(.*)$/.exec(param[i]);
                    if (result && result[1] === 'fragment') {

                        var redirectUrl = location.protocol + '//' + location.host + location.pathname;
                        param.splice(i, 1);

                        if (param.length) {
                            redirectUrl += '?' + param.join('&');
                        }

                        redirectUrl += '#' + result[2];
                        window.location = redirectUrl;

                        return;
                    }
                }
            }

            if (!target && document && document.body) {
                // render default into document.body
                target = document.body;
            }

            config = config || "config.json";

            callback = callback || function () {
            };

            if (!document) {
                callback("Document missing");
                return;
            }

            if (!target) {
                callback("Target missing");
                return;
            }


            // flow.js is not available here, so do it in a dirty way
            rAppid.createApplicationContext(mainClass, config, function (err, applicationContext) {
                if (err) {
                    callback(err);
                } else {
                    applicationContext.createApplicationInstance(window, function (err, stage, application) {
                        if (err) {
                            callback(err);
                        } else {

                            // start the application
                            application.start(parameter, function (err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    // render stage to target
                                    stage.render(target);

                                    callback(null, stage, application);
                                }
                            })
                        }
                    })
                }
            });

        },

        rewriteMapEntry: Rewrite,

        createQueryString: function (parameter) {
            var ret = [];

            for (var key in parameter) {
                if (parameter.hasOwnProperty(key)) {
                    ret.push(encodeURIComponent(key) + "=" + encodeURIComponent(parameter[key]));
                }
            }

            return ret.join("&");
        },

        ajax: function (url, options, callback) {

            var s = {
                url: url
            };

            underscore.extend(s, rAppid.ajaxSettings, options);

            if (s.data && !underscore.isString(s.data)) {
                throw "data must be a string";
            }

            s.hasContent = !/^(?:GET|HEAD)$/.test(s.type);

            if (s.queryParameter && underscore.keys(s.queryParameter).length > 0) {
                // append query parameter to url
                s.url += /\?/.test(s.url) ? "&" : "?" + this.createQueryString(s.queryParameter);
            }

            // create new xhr
            var xhr = s.xhr();
            xhr.open(s.type, s.url, s.async);

            if (s.hasContent && s.contentType !== false) {
                xhr.setRequestHeader("Content-Type", s.contentType);
                if(typeof window === "undefined"){
                    // On NodeJs the XMLHttprequest does not set Content-Length
                    // In the browser it's not allowed to set the Content-length
                    xhr.setRequestHeader("Content-Length", s.data ? s.data.length.toString() : "0");
                }
            }


            try {
                for (var header in s.headers) {
                    if (s.headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header, s.headers[header]);
                    }
                }
            } catch(e) {
            } // FF3

            xhr.send(s.data);

            var xhrCallback = function (_, isAbort) {

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

    var rAppidXhr = function (xhr) {
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
        } catch(e) {
            this.statusText = "";
        }
    };

    rAppidXhr.prototype.getResponseHeader = function (key) {
        var match;
        if (!this.$responseHeaders) {
            this.$responseHeaders = {};
            while (( match = rheaders.exec(this.$nativeResponseHeaders) )) {
                this.$responseHeaders[match[1].toLowerCase()] = match[2];
            }
        }
        return this.$responseHeaders[key.toLowerCase()];
    };


    rAppid.ajaxSettings = {
        type: "GET",
        contentType: "application/x-www-form-urlencoded",
        async: true,
        xhr: function () {
            return new XMLHttpRequest();
        },
        headers: {
        },
        data: null
    };

    var ApplicationContext = function (requirejsContext, config) {
        this.$requirejsContext = requirejsContext;
        this.$config = config;
    };

    ApplicationContext.prototype.createApplicationInstance = function (window, callback) {

        var document;

        // create instance
        var applicationFactory = this.$applicationFactory;

        if (window.document) {
            document = window.document;
        } else {
            document = window;
            window = null;
        }

        // TODO: add node support for window
        var stage = new Stage(this.$requirejsContext, this, document, window);

        this.$requirejsContext(["js/core/Application", "js/core/HeadManager", "js/core/History", "js/core/Injection"], function (Application, HeadManager, History, Injection) {
            stage.$headManager = new HeadManager(document);
            stage.$history = new History();
            var injection = stage.$injection = new Injection(null, null, stage);

            injection.addInstance(stage.$bus);
            injection.addInstance(stage.$history);
            injection.addInstance(stage.$headManager);

            var application = new applicationFactory(null, false, stage, null, null);

            if (application instanceof Application) {

                stage.$application = application;
                stage._initialize("auto");

                application._initialize("auto");

                // return rAppid instance
                if (callback) {
                    callback(null, stage, application);
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

    };

    ApplicationContext.prototype.getFqClassName = function (namespace, className, useRewriteMap) {
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
            fqClassName = 'xaml!' + fqClassName;
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
    };

    ApplicationContext.prototype.createInstance = function (fqClassName, args, className) {
        args = args || [];

        var classDefinition;

        if (fqClassName instanceof Function) {
            classDefinition = fqClassName;
            fqClassName = classDefinition.prototype.constructor.name;
        } else {
            fqClassName = fqClassName.replace(/\./g, "/");
            classDefinition = this.$requirejsContext(fqClassName);
        }

        className = className || fqClassName;

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
        } catch(e) {
            console.warn(["Cannot create instance of '" + fqClassName + "'", e, args]);
            throw e;
        }

        return ret;
    };

    ApplicationContext.prototype.ajax = function (url, options, callback) {

        if (!(/^http.*$/.test(url)) && this.$config.applicationUrl) {
            url = this.$config.applicationUrl + '/' + url;
        }

        rAppid.ajax(url, options, callback);
    };

    rAppid.defaultNamespaceMap = defaultNamespaceMap;
    rAppid.defaultRewriteMap = defaultRewriteMap;
    rAppid.ApplicationContext = ApplicationContext;
    rAppid.Rewrite = Rewrite;

    exports.rAppid = rAppid;

}(typeof exports !== "undefined" ? exports : window,
    typeof requirejs !== "undefined" ? requirejs : require('requirejs'),
    typeof requirejs !== "undefined" ? define : require('requirejs').define,
    typeof window !== "undefined" ? window : exports,
    typeof window !== "undefined" ? window.XMLHttpRequest : require('xmlhttprequest').XMLHttpRequest));
