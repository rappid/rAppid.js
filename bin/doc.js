var help = function (args, callback) {

    args = args || [];

    var amdDoc = require('./lib/doc.js'),
        fs = require('fs'),
        path = require('path'),
        flow = require('flow.js').flow,
        rAppid = require("..").rAppid,
        vkbeautify = require(__dirname + "/lib/vkbeautify").vkbeautify,
        argv = require('optimist')(args)
            .usage("rappidjs doc <dir> [<dir2>]")
            .demand(1)
            .options('o', {
                alias: 'output'
            })
            .options('s', {
                alias: 'suffix',
                default: '.json'
            })
            .option('c', {
                alias: 'config'
            })
            .option('l', {
                alias: 'library-path'
            })
            .options('x', {
                alias: 'exclude'
            })
            .describe({
                o: 'output directory where the my.class.suffix files will be saved',
                x: 'excludes files or folders from getting parsed',
                c: 'loads the defined config file',
                l: 'the path for libraries. No files will generated for libraries',
                xsd: 'output directory for xsd schema files'
            })
            .argv,

        outputDir,
        xsdDir,
        libraryPaths;

    outputDir = argv.o ? argv.o.replace(/^~\//, process.env.HOME + '/') : null;
    xsdDir = argv.xsd ? argv.xsd.replace(/^~\//, process.env.HOME + '/') : null;

    libraryPaths = argv.l instanceof Array ? argv.l : [argv.l];

    generateDocumentation(argv._, libraryPaths);


    function generateDocumentation(startFiles, libraryPaths) {

        var documentation = new amdDoc.Documentation(),
            paths,
            stat, i;

        libraryPaths = libraryPaths || [];


        if (startFiles.length === 1 && fs.statSync(startFiles[0].replace(/^~\//, process.env.HOME + '/')).isFile()) {
            var extension = /\.([a-z]+)$/.exec(startFiles[0]);

            if (extension) {
                documentation.generateDocumentationsForFile(extension[1], fs.readFileSync(startFiles[0], 'UTF-8'), startFiles[0], startFiles[0]);
            } else {
                console.warn("Cannot generate documentation for " + startFiles[0]);
            }

        } else {

            var directories = startFiles.concat(libraryPaths);

            for (i = 0; i < directories.length; i++) {

                var directory = directories[i],
                    isLibrary = libraryPaths.indexOf(directory) !== -1;

                if (!directory) {
                    continue;
                }

                directory = directory.replace(/^~\//, process.env.HOME + '/');

                stat = fs.statSync(directory);

                if (stat.isDirectory()) {
                    paths = findFiles(directory);
                    paths.forEach(function (p) {
                        var shortPath = path.relative(path.join(directory, '..'), p),
                            code = fs.readFileSync(p, 'UTF-8');

                        console.log(shortPath);

                        var defaultFqClassName = shortPath.replace(/\//g, '.').replace(/\.js$/, '').replace(/\.xml$/, '');
                        var extension = /\.([a-z]+)$/.exec(shortPath);

                        if (extension) {
                            documentation.generateDocumentationsForFile(extension[1], code, defaultFqClassName, shortPath, isLibrary);
                        } else {
                            console.warn("Cannot generate documentation for " + shortPath);
                        }


                    });
                }
            }


        }

        var output = documentation.process(),
            fqClassName;

//        var output = JSON.parse(fs.readFileSync("/Users/tony/tmp/output.json")),
//            fqClassName;

//        fs.writeFileSync("/Users/tony/tmp/output.json", JSON.stringify(output));

        if (!outputDir) {
            console.log(JSON.stringify(output, null, 4));
        } else {
            // output directory specified

            // generate index.json
            var documentedClasses = Object.keys(output);
            var classes = [];

            documentedClasses.forEach(function(className) {
                if (documentation.excludeDocumentations.indexOf(className) === -1) {
                    classes.push(className);
                }
            });

            classes.sort();

            var index;
            var indexJsonPath = path.join(outputDir, "index.json");
            if (fs.existsSync(indexJsonPath)) {
                index = JSON.parse(fs.readFileSync(indexJsonPath, "utf8"));
            }

            index = index || {};
            index.classes = classes;

            writeFile(indexJsonPath, index);

            for (fqClassName in output) {
                if (output.hasOwnProperty(fqClassName) && documentation.excludeDocumentations.indexOf(fqClassName) === -1) {
                    writeFile(path.join(outputDir, fqClassName + '.json'), output[fqClassName]);
                }
            }
        }

        if (xsdDir) {
            // generate schema files

            // map documentation based on their package
            var xmlDom = require("xmldom"),
                packages = {};

            for (fqClassName in output) {
                if (output.hasOwnProperty(fqClassName) && documentation.excludeDocumentations.indexOf(fqClassName) === -1) {
                    var doc = output[fqClassName];

                    if (doc.package) {
                        doc.inheritancePath = doc.inheritancePath || [];

                        var componentFqClassName = "js.core.Component";
                        var inheritFromComponent = fqClassName === componentFqClassName;
                        for (i = 0; i < doc.inheritancePath.length; i++) {
                            if (doc.inheritancePath[i] === componentFqClassName) {
                                inheritFromComponent = true;
                                break;
                            }
                        }

                        if (inheritFromComponent) {
                            var currentPackage = packages[doc.package] = packages[doc.package] || {
                                classes: [],
                                imports: []
                            };

                            // check doc for inheritance from different package
                            if (output.hasOwnProperty(doc.inherit)) {
                                var importPackage = output[doc.inherit].package;

                                if (importPackage && currentPackage.imports.indexOf(importPackage) === -1 && doc.package !== importPackage) {
                                    currentPackage.imports.push(importPackage);
                                }
                            }

                            currentPackage.classes.push(doc);
                        }

                    } else {
                        console.warn("No package defined for " + fqClassName);
                    }
                }
            }

//            packages = {
//                "js.core": packages["js.core"]
//            };

            process.stdin.resume();

            var config = {
                xamlClasses: ["xsd/XsdGenerator"],
                paths: {
                    "xsd": "bin/lib/xsd",
                    "xaml": "js/plugin/xaml",
                    "json": "js/plugin/json",
                    "raw": "js/plugin/raw",
                    "flow": "js/lib/flow",
                    "inherit": "js/lib/inherit",
                    "underscore": "js/lib/underscore"
                },
                baseUrl: __dirname + "/../",
                namespaceMap: {
                    "http://www.w3.org/2001/XMLSchema": "xsd.core"
                },
                rewriteMap: [
                    new rAppid.Rewrite(/^xsd\/core\/(.*)/, "xsd/core/XsdElement")
                ],
                "shim": {
                    "inherit": {
                        "exports": "inherit"
                    },
                    "flow": {
                        "exports": "flow"
                    },
                    "underscore": {
                        "exports": "_"
                    },
                    "JSON": {
                        "exports": "JSON"
                    },
                    "Query": {
                        "exports": "Query"
                    },
                    "js/lib/parser": {
                        "exports": "parser"
                    },
                    "RestConditionParser": {
                        "exports": "parser"
                    },
                    "moment": {
                        "exports": "moment"
                    }
                }
            };

            flow()
                .seq("applicationContext", function (cb) {
                    rAppid.createApplicationContext("xsd/XsdGenerator", config, cb);
                })
                .parEach(packages, function(p, namespace, cb) {

                    if (p.classes.length === 0) {
                        cb();
                        return;
                    }

                    var applicationContext = this.vars.applicationContext;

                    flow()
                        .seq("window", function () {
                            // generate document
                            var document = (new xmlDom.DOMParser()).parseFromString("<foo />");

                            document.head = document.head || document.getElementsByTagName("head")[0];
                            document.body = document.body || document.getElementsByTagName("body")[0];

                            return {
                                document: document
                            };
                        })
                        .seq("app", function (cb) {
                            applicationContext.createApplicationInstance(cb.vars.window, function (err, s, application) {
                                cb(err, application);
                            });
                        })
                        .seq(function (cb) {
                            cb.vars["app"].start({
                                "package": p,
                                "namespace": namespace,
                                documentations: output
                            }, cb);
                        })
                        .seq(function () {
                            //noinspection JSPotentiallyInvalidUsageOfThis
                            var dom = this.vars.app.render(this.vars.window.document);
                            var xsd = (new xmlDom.XMLSerializer()).serializeToString(dom.childNodes[0]);

                            // pretty print xml
                            xsd = vkbeautify.xml(xsd);

                            fs.writeFileSync(xsdDir + "/" + namespace + ".xsd", xsd, "utf8");
                        })
                        .exec(function (err) {
                            cb(err);
                        });
                })
                .exec(function (err) {

                    if (err) {
                        console.log(err);
                    }

                    process.exit(err ? 1 : 0);

                });
        }


        function writeFile(path, data) {
            fs.writeFileSync(path, JSON.stringify(data, null, 4));
        }

        function findFiles(dir) {

            var ret = [],
                extension = [".js", ".xml"],
                files = fs.readdirSync(dir);

            for (var i = 0; i < files.length; i++) {
                var file = path.join(dir, files[i]);
                var stat = fs.statSync(file);

                if (stat.isDirectory() && !isExcluded(file)) {
                    ret = ret.concat(findFiles(file));
                } else if (stat.isFile() && extension.indexOf(path.extname(file)) !== -1 && !isExcluded(file)) {
                    // javascript file or xaml
                    ret.push(file);
                }
            }

            return ret;

        }

        function isExcluded(path) {
            // TODO: implement
            return false;
        }
    }


};

help.usage = function () {
    help();
};

module.exports = help;


