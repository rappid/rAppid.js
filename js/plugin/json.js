define(['JSON'], function (JSON) {
    var fs, createXhr,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        fetchJSON = function (url, callback) {
            throw new Error('Environment unsupported.');
        },
        buildMap = {},
        rSuffix = /^(.+)\.json$/i;


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

        fetchJSON = function (url, callback) {
            var xhr;

            try {
                xhr = createXhr();
                xhr.open('GET', url, true);
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if ((xhr.status === 200 || xhr.status === 304) && xhr.responseText) {
                            callback(null, xhr.responseText);
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

        fetchJSON = function (path, callback) {
            try {
                var content = fs.readFileSync(path, 'utf8');
                callback(null, content);
            } catch(e) {
                callback(e);
            }
        };
    }

    return {

        write: function (pluginName, name, write) {

            if (name in buildMap) {
                var text = buildMap[name];
                write.asModule(pluginName + "!" + name,
                    "define(function () { return " +
                        text +
                        ";});\n");
            }
        },

        version: '0.1.0',

        load: function (name, parentRequire, load, config) {

            var resourceName = name;

            name = name.replace(rSuffix, "$1");
            name = name + ".json";

            var url = parentRequire.toUrl(name);

            fetchJSON(url, function (err, json) {
                if (!err) {

                    if (config.isBuild) {
                        buildMap[resourceName] = json;
                    }

                    load(JSON.parse(json));

                } else {
                    load.error(new Error("JSON for " + url + " not found"));
                }
            });
        }

    };
});


