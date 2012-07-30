define([], function () {
    var fs, createXhr,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        fetchXaml = function (url, callback) {
            throw new Error('Environment unsupported.');
        },
        buildMap = {},
        importRegEx = /((?:xaml!)?[a-z]+(\.[a-z]+[a-z0-9]*)*)/mgi;


    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] == obj) {
                    return i;
                }
            }
            return -1;
        }
    }

    /**
     * IE8 FIXES
     * @param domNode
     */
    var localNameFromDomNode = function (domNode) {
        if (domNode.localName) return domNode.localName;

        var st = domNode.tagName.split(":");
        return st[st.length - 1];
    };

    function hasContent(string) {
        return /\S/.test(string);
    }

    function getDependency(namespace, localName, namespaceMap, xamlClasses, rewriteMap) {

        namespaceMap = namespaceMap || {};
        rewriteMap = rewriteMap || {};
        xamlClasses = xamlClasses || [];

        namespace = (namespaceMap[namespace] || namespace).replace(/\./g, '/');
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

    function getTextContentFromNode(a) {
        var b = a.textContent || a.text || a.data;
        if (!b) {
            b = "";
            for (var c = 0; c < a.childNodes.length; c++) {
                var d = a.childNodes[c];
                if (d.nodeType == 1 || d.nodeType == 4) b += this._getTextContentFromDescriptor(d);
            }
        }
        return b;
    }

    function findDependencies(xaml, namespaceMap, xamlClasses, rewriteMap, imports) {

        var ret = [];

        function findDependencies(domNode) {

            var localName = localNameFromDomNode(domNode);

            var dep = getDependency(domNode.namespaceURI, localName, namespaceMap, xamlClasses, rewriteMap);
            // console.log(dep);
            if (dep == "js/core/Imports") {
                for (var t = 0; t < domNode.childNodes.length; t++) {
                    var importNode = domNode.childNodes[t];
                    if (importNode.nodeType == 3) {
                        // text node
                        var m;

                        var textContent = getTextContentFromNode(importNode);
                        while ((m = importRegEx.exec(textContent + " ")) != null) {
                            var importClass = m[0].replace(/\./g, "/");
                            if (importClass !== "undefined") {
                                if (ret.indexOf(importClass) == -1) {
                                    ret.push(importClass);
                                }

                                if (imports) {
                                    imports.push(importClass);
                                }
                            }
                        }
                    }
                }
            }

            if (ret.indexOf(dep) == -1) {
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

    function findScripts(xaml, namespaceMap, xamlClasses, rewriteMap) {
        var ret = [];

        for (var i = 0; i < xaml.childNodes.length; i++) {
            var node = xaml.childNodes[i];
            if (node.nodeType == 1) {
                if ("js/core/Script" == getDependency(node.namespaceURI, localNameFromDomNode(node), namespaceMap, xamlClasses, rewriteMap)) {
                    ret.push(node);
                }
            }
        }

        return ret;
    }

    function getDeclarationFromScripts(scripts) {
        var ret = {};

        if (scripts) {
            for (var s = 0; s < scripts.length; s++) {
                var script = scripts[s];
                for (var fn in script) {
                    if (script.hasOwnProperty(fn)) {
                        ret[fn] = script[fn];
                    }
                }
            }
        }

        return ret;
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
                    } catch(e) {
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
            var xhr;

            try {
                xhr = createXhr();
                xhr.open('GET', url, true);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.responseXML) {
                            callback(null, xhr.responseXML);
                        } else {
                            callback("no responseXML found");
                        }
                    }
                };
                xhr.send(null);
            } catch(e) {
                callback(e);
            }
        };
        // end browser.js adapters
    } else if (typeof process !== "undefined" && process.versions && !!process.versions.node) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        fetchXaml = function (path, callback) {
            try {
                var content = fs.readFileSync(path, 'utf8');
                callback(null, require.nodeRequire('libxml').parseFromString(content));
            } catch(e) {
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

        version: '0.2.0',

        load: function (name, parentRequire, load, config) {

            var url = parentRequire.toUrl(name + ".xml");

            if (config.optimizedXAML && config.optimizedXAML.indexOf(name) > -1) {
                parentRequire([name], function () {
                    parentRequire(["xaml!"+name], function(value){
                        load(value);
                    });
                });
            } else {
                fetchXaml(url, function (err, xml) {

                    if (!err && xml) {

                        // require all dependencies
                        var imports = [],
                            importStartIndex = 1;

                        var dependencies = findDependencies(xml.documentElement,
                            config.namespaceMap, config.xamlClasses, config.rewriteMap, imports);

                        var scripts = findScripts(xml.documentElement,
                            config.namespaceMap, config.xamlClasses, config.rewriteMap);

                        if (scripts.length > 1) {
                            throw "only one script block allowed in XAML";
                        }

                        if (scripts.length > 0) {
                            // at least one script
                            dependencies.splice(1, 0, "js/core/Script");
                            importStartIndex++;
                        }

                        if (imports.length > 0) {
                            // add imports after start index
                            dependencies = dependencies.slice(0, importStartIndex)
                                .concat(imports)
                                .concat(dependencies.slice(importStartIndex));
                        }

                        if (config.isBuild) {
                            dependencies.splice(1, 0, "js/core/Element");
                            importStartIndex++;

                            var text = "define(%dependencies%, %function%)";
                            var fn = "function(baseClass, ELEMENT %parameter%){%GLOBALS% return baseClass.inherit({ %classDefinition% _$descriptor: ELEMENT.xmlStringToDom(%descriptor%)})}";

                            var depsEscaped = [];
                            for (var i = 0; i < dependencies.length; i++) {
                                depsEscaped.push("'" + dependencies[i] + "'");
                            }

                            text = text.replace('%dependencies%', '[' + depsEscaped.join(',') + ']');

                            var xmlContent = xml.documentElement.toString()
                                .replace(/((\r\n|\n|\r)[\s\t]*)/gm, " ")
                                .replace(/\s{2,}/g, " ")
                                .replace(/'/g, "\\'")
                                .replace(/<js:Script[^>]*>[\s\S]*<\/js:Script[^>]*>/, "");

                            var parameter = "",
                                classDefinition = "",
                                globals = "";

                            if (scripts.length > 0) {
                                var script = scripts[0].toString();

                                var rScriptExtractor = /^[\s\S]*?function\s*\(([\s\S]*?)\)[\s\S]*?\{([\s\S]*?)return[\s\S]*?\{([\s\S]*)\}[\s\S]*?\}[\s\S]*?\)[^)]*$/;
                                var result = rScriptExtractor.exec(script);

                                if (result) {
                                    // get parameter and trim
                                    if (hasContent(result[1])) {
                                        // add comma for separate from baseClass
                                        parameter = ",SCRIPT," + result[1];
                                    }

                                    if (hasContent(result[2])) {
                                        globals = result[2];
                                    }

                                    if (hasContent(result[3])) {
                                        classDefinition = result[3] + ','
                                    }

                                } else {
                                    throw "Error parsing script block";
                                }

                            }

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
                                var baseClass = arguments[0],
                                    Script = arguments[1];

                                var args = Array.prototype.slice.call(arguments);

                                var scriptObjects = [];
                                var importedClasses = args.slice(importStartIndex);

                                if (scripts.length > 0) {
                                    for (var s = 0; s < scripts.length; s++) {
                                        try {
                                            var scriptInstance = new Script(null, scripts[s]);
                                            scriptObjects.push(scriptInstance.evaluate(importedClasses));
                                        } catch(e) {
                                            load.error(new Error(name + ": Script cannot be loaded" + e));
                                        }
                                    }
                                }

                                var xamlFactory = baseClass.inherit(
                                    getDeclarationFromScripts(scriptObjects)
                                );

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
    }
});


