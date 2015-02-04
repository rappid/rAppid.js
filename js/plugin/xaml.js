define([], function () {
    var fs, createXhr,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        fetchXaml = function (url, callback) {
            throw new Error('Environment unsupported.');
        },
        buildMap = {};

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] == obj) {
                    return i;
                }
            }
            return -1;
        };
    }

    /**
     * IE8 FIXES
     * @param domNode
     */
    var localNameFromDomNode = function (domNode) {
        if (domNode.localName) {
            return domNode.localName;
        }

        var st = domNode.tagName.split(":");
        return st[st.length - 1];
    };

    function getDependency(namespace, localName, namespaceMap, xamlClasses, rewriteMap) {

        namespaceMap = namespaceMap || {};
        rewriteMap = rewriteMap || {};
        xamlClasses = xamlClasses || [];

        namespace = (namespaceMap[namespace] || namespace);

        if (!namespace) {
            console.warn("It seems that you forgot to add a namespace. Try using xmlns='http://www.w3.org/1999/xhtml' in your xaml");
        }

        namespace = namespace.replace(/\./g, '/');
        var fqClassName = [namespace, localName].join("/");


        for (var i = 0; i < rewriteMap.length; i++) {
            var entry = rewriteMap[i];
            if (entry.$from && entry.$to) {
                if (entry.$from.test(fqClassName)) {
                    fqClassName = fqClassName.replace(entry.$from, entry.$to);

                    break;
                }
            }
        }

        if (xamlClasses.indexOf(fqClassName) !== -1) {
            fqClassName = "xaml!" + fqClassName;
        }

        return fqClassName.replace(/\./g, "/");
    }

    function findDependencies(xaml, namespaceMap, xamlClasses, rewriteMap, requestor) {

        var ret = [];

        function findDependencies(domNode) {

            var localName = localNameFromDomNode(domNode);

            var dep = getDependency(domNode.namespaceURI, localName, namespaceMap, xamlClasses, rewriteMap);
            // console.log(dep);

            if (ret.indexOf(dep) == -1 && dep !== requestor) {
                ret.push(dep);
            }

            for (var i = 0; i < domNode.childNodes.length; i++) {
                var childNode = domNode.childNodes[i];
                // element
                if (childNode.nodeType == 1) {
                    findDependencies(childNode);
                }
            }

        }

        if (xaml) {
            findDependencies(xaml);
        }

        return ret;
    }

    function cleanUpDescriptor(desc) {
        if (desc && desc.childNodes) {
            var node, text;
            // remove empty text nodes
            for (var i = desc.childNodes.length - 1; i >= 0; i--) {
                node = desc.childNodes[i];
                if (node.nodeType === 3) {
                    text = node.textContent || node.text || node.data;
                    if (!text || text.trim().length === 0) {
                        desc.removeChild(node);
                    }
                } else {
                    cleanUpDescriptor(node);
                }
            }
        }
    }

    if ((typeof window !== "undefined" && window.navigator && window.document) || typeof importScripts !== "undefined") {
        // Browser action
        createXhr = function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else {
                for (i = 0; i < 3; i++) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) {
                        // nothing to do here
                    }

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            if (!xhr) {
                throw new Error("getXhr(): XMLHttpRequest not available");
            }

            return xhr;
        };

        fetchXaml = function (url, callback) {

            var dataUrl = /^data:/;
            if (dataUrl.test(url)) {
                try {
                    var data = url.replace(dataUrl, "").replace(/\.xml$/, "");
                    callback(null, (new DOMParser()).parseFromString(data, "application/xml"));
                } catch (e) {
                    callback(e);
                }

            } else {
                var xhr;

                try {
                    xhr = createXhr();
                    xhr.open('GET', url, true);
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200 || xhr.status === 304) {
                                if (xhr.responseXML) {
                                    callback(null, xhr.responseXML);
                                } else {
                                    callback("no responseXML found");
                                }
                            } else {
                                callback("got status " + xhr.status + " for " + url);
                            }
                        }
                    };
                    xhr.send(null);
                } catch (e) {
                    callback(e);
                }
            }
        };
        // end browser.js adapters
    } else if (typeof process !== "undefined" && process.versions && !!process.versions.node) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        fetchXaml = function (path, callback) {
            try {
                var content = fs.readFileSync(path, 'utf8'),
                    DOMParser = require.nodeRequire('xmldom').DOMParser;
                callback(null, (new DOMParser()).parseFromString(content));
            } catch (e) {
                callback(e);
            }
        };
    }


    return {

        write: function (pluginName, name, write) {

            if (name in buildMap) {
                var text = buildMap[name];
                write.asModule(pluginName + "!" + name, text);
            }
        },

        version: '0.3.0',

        load: function (name, parentRequire, load, config) {

            var url = parentRequire.toUrl(name + ".xml");

            if (config.optimizedXAML && config.optimizedXAML.indexOf(name) > -1) {
                parentRequire([name], function () {
                    parentRequire(["xaml!" + name], function (value) {
                        load(value);
                    });
                });
            } else {
                fetchXaml(url, function (err, xml) {

                    if (!err && xml) {

                        cleanUpDescriptor(xml.documentElement);

                        // require all dependencies
                        var dependencies = findDependencies(xml.documentElement,
                            config.namespaceMap, config.xamlClasses, config.rewriteMap, "xaml!" + name);


                        if (config.isBuild) {
                            dependencies.splice(1, 0, "js/core/Element");

                            var text = "define(%dependencies%, %function%)";
                            var fn = "function(baseClass, ELEMENT %parameter%){%GLOBALS% return baseClass.inherit({ %classDefinition% _$descriptor: ELEMENT.xmlStringToDom(%descriptor%)})}";

                            var depsEscaped = [];
                            for (var i = 0; i < dependencies.length; i++) {
                                depsEscaped.push("'" + dependencies[i] + "'");
                            }

                            text = text.replace('%dependencies%', '[' + depsEscaped.join(',') + ']');

                            var xmlContent = xml.documentElement.toString()
                                .replace(/\\/g, "\\\\")
                                .replace(/(\r\n|\n|\r)/gm, "\\n")
                                .replace(/'/g, "\\'");

                            if (config.removeSpaces === true) {
                                xmlContent = xmlContent.replace(/\s+/g, " ").replace(/\\[nr]/g, "");
                            }

                            var parameter = "",
                                classDefinition = "",
                                globals = "";

                            fn = fn.replace('%parameter%', parameter);
                            fn = fn.replace('%classDefinition%', classDefinition);
                            fn = fn.replace('%GLOBALS%', globals);
                            fn = fn.replace('%descriptor%', "'" + xmlContent + "'");

                            text = text.replace('%function%', fn);
                            load.fromText(name, "(function () {" + text + "}).call(this);");

                            buildMap[name] = text;

                            parentRequire([name], function (value) {
                                parentRequire(dependencies, function () {
                                    load(value);
                                });
                            });
                        } else {
                            // first item should be the dependency of the document element
                            parentRequire(dependencies, function (value) {

                                // dependencies are loaded
                                var baseClass = arguments[0];
                                var xamlFactory = baseClass.inherit(name.replace(/\//g, "."), {});

                                xamlFactory.prototype._$descriptor = xml.documentElement;

                                load(xamlFactory);
                            }, function (err) {
                                load.error(err);
                            });
                        }
                    } else {
                        load.error(new Error("XML " + url + " not found." + err));
                    }
                });
            }
        }
    };
});


