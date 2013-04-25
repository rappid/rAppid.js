var esprima = require('esprima'),
    inherit = require('inherit.js').inherit,
    undefined,
    DomParser = require('xmldom').DOMParser,
    _ = require('underscore'),
    CONST = {
        AssignmentExpression: 'AssignmentExpression',
        ArrayExpression: 'ArrayExpression',
        BlockStatement: 'BlockStatement',
        BinaryExpression: 'BinaryExpression',
        BreakStatement: 'BreakStatement',
        CallExpression: 'CallExpression',
        CatchClause: 'CatchClause',
        ConditionalExpression: 'ConditionalExpression',
        ContinueStatement: 'ContinueStatement',
        DoWhileStatement: 'DoWhileStatement',
        DebuggerStatement: 'DebuggerStatement',
        EmptyStatement: 'EmptyStatement',
        ExpressionStatement: 'ExpressionStatement',
        ForStatement: 'ForStatement',
        ForInStatement: 'ForInStatement',
        FunctionDeclaration: 'FunctionDeclaration',
        FunctionExpression: 'FunctionExpression',
        Identifier: 'Identifier',
        IfStatement: 'IfStatement',
        Literal: 'Literal',
        LabeledStatement: 'LabeledStatement',
        LogicalExpression: 'LogicalExpression',
        MemberExpression: 'MemberExpression',
        NewExpression: 'NewExpression',
        ObjectExpression: 'ObjectExpression',
        Program: 'Program',
        Property: 'Property',
        ReturnStatement: 'ReturnStatement',
        SequenceExpression: 'SequenceExpression',
        SwitchStatement: 'SwitchStatement',
        SwitchCase: 'SwitchCase',
        ThisExpression: 'ThisExpression',
        ThrowStatement: 'ThrowStatement',
        TryStatement: 'TryStatement',
        UnaryExpression: 'UnaryExpression',
        UpdateExpression: 'UpdateExpression',
        VariableDeclaration: 'VariableDeclaration',
        VariableDeclarator: 'VariableDeclarator',
        WhileStatement: 'WhileStatement',
        WithStatement: 'WithStatement'
    },

    hasAnnotationDefinition = /^\s*\*\s*@/,

    stripLineStart = /^\s*\*\s*/,

    Documentation = inherit.Base.inherit({

        ctor: function () {


            this.documentations = {};
            this.documentationProcessors = {
                js: new ClassDocumentationProcessor(),
                xml: new XamlClassDocumentationProcessor()
            };

        },

        addClassDocumentation: function (className, classDocumentation) {

            if (!className) {
                throw "className omitted";
            }

            if (!(classDocumentation instanceof ClassDocumentation)) {
                throw "not a ClassDocumentation";
            }

            if (this.documentations[className]) {
                throw "overwrite documentation for class: " + className;
            }

            this.documentations[className] = classDocumentation;
        },

        generateDocumentationsForFile: function (type, code, defaultFqClassName, add, path) {

            var processor = this.documentationProcessors[type];

            if (!processor) {
                throw 'Processor for type "' + type + '" not found.';
            }

            var docs = processor.generate(code, defaultFqClassName);

            docs.forEach(function (doc) {
                doc.file = path;
                doc.package = path.replace(/\/[^/]+$/, "").replace(/\//g, ".");
            });

            if (add) {
                docs.forEach(function (doc) {
                    this.addClassDocumentation(doc.fqClassName, doc);
                }, this);
            }

            return docs;
        },

        process: function () {
            var fqClassName,
                classDocumentation;

            for (fqClassName in this.documentations) {
                if (this.documentations.hasOwnProperty(fqClassName)) {
                    classDocumentation = this.documentations[fqClassName];

                    if (classDocumentation.inherit && !classDocumentation.inheritancePath) {

                        if (classDocumentation.inherit === fqClassName) {
                            console.warn('Class ' + fqClassName + ' inherit from itself');
                        } else {
                            // build the inheritance path
                            classDocumentation.inheritancePath = classDocumentation.generateInheritancePath(this.documentations);
                        }
                    }

                    if (classDocumentation.inheritancePath) {
                        // find inherit methods
                        classDocumentation.addInheritMethods(this.documentations);

                        classDocumentation.extendInherit(this.documentations, "defaults");
                        classDocumentation.extendInherit(this.documentations, "properties");

                    }
                }
            }

            // convert methods object into array
            for (fqClassName in this.documentations) {
                if (this.documentations.hasOwnProperty(fqClassName)) {

                    classDocumentation = this.documentations[fqClassName];

                    var methodArray = [],
                        methodNames = _.keys(classDocumentation.methods);

                    methodNames.sort();

                    for (var i = 0; i < methodNames.length; i++) {
                        var methodName = methodNames[i];
                        var method = classDocumentation.methods[methodName];
                        method.name = methodName;
                        method.visibility = (methodName.substr(0, 1) === '_' || method.hasOwnProperty('private')) && !method.hasOwnProperty('public') ? 'protected' : 'public';

                        methodArray.push(method);
                    }

                    classDocumentation.methods = methodArray;

                }
            }


            return this.documentations;

        }
    }),

    ClassDocumentation = inherit({

        ctor: function (definition) {
            definition = definition || {};

            for (var key in definition) {
                if (definition.hasOwnProperty(key)) {
                    this[key] = definition[key];
                }
            }

            _.defaults(this, {
                methods: {},
                defaults: {}
            });
        },

        getParameterByNameForMethod: function (parameterName, methodName) {
            if (this.methods.hasOwnProperty(methodName)) {
                for (var i = 0; i < this.methods[methodName].parameter.length; i++) {
                    var parameter = this.methods[methodName].parameter[i];
                    if (parameter.name === parameterName) {
                        return parameter;
                    }
                }
            }

            return null;
        },

        generateInheritancePath: function (documentations) {

            var ret = [];

            if (this.inherit) {

                ret.push(this.inherit);

                var inheritFrom = documentations[this.inherit];
                if (inheritFrom) {
                    if (inheritFrom === this) {
                        console.warn('Inherits from itself');
                    } else {
                        ret = ret.concat(inheritFrom.generateInheritancePath(documentations));
                    }
                }
            }

            return ret;
        },

        addInheritMethods: function (documentations) {

            var nativeMethods = [],
                methodName;

            for (methodName in this.methods) {
                if (this.methods.hasOwnProperty(methodName)) {
                    nativeMethods.push(methodName);
                }
            }

            if (this.inheritancePath instanceof Array) {
                for (var i = 0; i < this.inheritancePath.length; i++) {
                    var baseClassFqClassName = this.inheritancePath[i];

                    if (documentations.hasOwnProperty(baseClassFqClassName)) {

                        var baseClass = documentations[baseClassFqClassName];

                        for (methodName in baseClass.methods) {
                            if (baseClass.methods.hasOwnProperty(methodName)) {

                                var currentMethod = null;

                                if (_.indexOf(nativeMethods, methodName) !== -1) {
                                    currentMethod = this.methods[methodName];
                                }

                                if (!currentMethod) {
                                    // inherit method
                                    currentMethod = this.methods[methodName] = _.clone(baseClass.methods[methodName]);
                                }

                                currentMethod.definedBy = baseClassFqClassName;

                                if (nativeMethods.indexOf(methodName) !== -1) {
                                    // overwrite methodName
                                    currentMethod.overwritesMethod = true;
                                }

                                for (var j = 0; j < currentMethod.parameter.length; j++) {
                                    var localParameter = currentMethod.parameter[j];

                                    if (Object.keys(localParameter).length === 1) {
                                        // only the name of the parameter defined -> extend parameter properties

                                        var inheritParameter = baseClass.getParameterByNameForMethod(localParameter.name, methodName);
                                        if (inheritParameter) {
                                            _.defaults(localParameter, inheritParameter);
                                        }
                                    }
                                }
                            }
                        }

                    }

                }
            }

        },

        extendInherit: function (documentations, field) {
            var own = [],
                property,
                scope = this[field] || {};

            for (property in scope) {
                if (scope.hasOwnProperty(property)) {
                    own.push(property);
                }
            }

            if (this.inheritancePath instanceof Array) {
                for (var i = 0; i < this.inheritancePath.length; i++) {
                    var baseClassFqClassName = this.inheritancePath[i];

                    if (documentations.hasOwnProperty(baseClassFqClassName)) {

                        var baseClass = documentations[baseClassFqClassName];

                        var baseScope = baseClass[field];
                        for (property in baseScope) {
                            if (baseScope.hasOwnProperty(property)) {

                                var currentDefault = null;

                                if (_.indexOf(own, property) !== -1) {
                                    currentDefault = scope[property];
                                }

                                if (!currentDefault) {
                                    // inherit method
                                    currentDefault = scope[property] = _.clone(baseScope[property]);
                                }

                                currentDefault.definedBy = baseClassFqClassName;

                                if (own.indexOf(property) !== -1) {
                                    // overwrite property
                                    currentDefault.overwrites = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }),

    ClassDocumentationProcessor = inherit({

        ctor: function () {
            this.classAnnotationProcessors = [
                new Documentation.Processors.Class(),
                new Documentation.Processors.General('summary'),
                new Documentation.Processors.General('inherit'),
                new Documentation.Processors.General('see', true),
                new Documentation.Processors.General('ignore'),
                new Documentation.Processors.Description()
            ];

            this.prototypeAnnotationProcessors = [
                new Documentation.Processors.Parameter(),
                new Documentation.Processors.Return(),
                new Documentation.Processors.General('private'),
                new Documentation.Processors.General('public'),
                new Documentation.Processors.General('deprecated'),
                new Documentation.Processors.General('abstract'),
                new Documentation.Processors.General('ignore'),
                new Documentation.Processors.General('see', true),
                new Documentation.Processors.Description()
            ];

            this.propertyAnnotationProcessors = [
                new Documentation.Processors.General('policy'),
                new Documentation.Processors.General('ignore'),
                new Documentation.Processors.General('deprecated'),
                new Documentation.Processors.Type(),
                new Documentation.Processors.Description()
            ];

            this.defaultAnnotationProcessors = [
                new Documentation.Processors.General('see', true),
                new Documentation.Processors.General('ignore'),
                new Documentation.Processors.General('deprecated'),
                new Documentation.Processors.Type(),
                new Documentation.Processors.Description()
            ];

            this.methodAnnotationProcessors = {
                onChange: new Documentation.Processors.ArrayMethodAnnotationProcessor("onChange"),
                on: new Documentation.Processors.OnMethodAnnotationProcessor(),
                bus: new Documentation.Processors.ArrayMethodAnnotationProcessor("bus")
            };
        },

        generate: function (code, fqClassName) {

            var ast = this.ast = esprima.parse(code, {
                    comment: true,
                    range: true
                }),
                ret = [];

            this.code = code;

            // search for all define statements in file
            for (var i = 0; i < ast.body.length; i++) {
                var body = ast.body[i],
                    expression = body.expression;

                if (body.type === CONST.ExpressionStatement &&
                    expression.type === CONST.CallExpression &&
                    expression.callee.name === 'define') {

                    // we found an define expression
                    if (expression.arguments.length >= 2 &&
                        expression.arguments[0].type === CONST.ArrayExpression &&
                        expression.arguments[1].type === CONST.FunctionExpression) {
                        // that's how a amd works -> extract the class definition

                        var varToRequireMap = {},
                            dependencies = [];

                        for (var j = 0; j < expression.arguments[1].params.length; j++) {
                            varToRequireMap[expression.arguments[1].params[j].name] = expression.arguments[0].elements[j].value;
                            dependencies.push((expression.arguments[0].elements[j].value || "").replace(/\//g, "."));
                        }

                        var classDocumentation = this.getClassDocumentation(expression.arguments[1].body, varToRequireMap);
                        if (classDocumentation) {

                            dependencies.sort();
                            classDocumentation.dependencies = dependencies;

                            // get annotations for class from body begin until class definition begin
                            var annotations = this.getAnnotationInRange(body.range[0], classDocumentation.start, this.classAnnotationProcessors);

                            for (var a = 0; a < annotations.length; a++) {
                                var annotation = annotations[a];
                                annotation.processor.mapAnnotationToItem(annotation, classDocumentation, annotations);
                            }

                            delete classDocumentation.start;

                            classDocumentation.fqClassName = classDocumentation.fqClassName || fqClassName;
                            classDocumentation.type = "js";

                            if (!classDocumentation.hasOwnProperty(('ignore'))) {
                                ret.push(new ClassDocumentation(classDocumentation));
                            }
                        }

                    }
                }
            }

            return ret;

        },

        getClassDocumentation: function (functionBody, varToRequireMap) {

            for (var i = 0; i < functionBody.body.length; i++) {
                var statement = functionBody.body[i],
                    argument = statement.argument,
                    classDocumentation;

                if (statement.type === CONST.ReturnStatement) {


                    if (argument.type === CONST.CallExpression) {
                        // class definition should use inherit.js

                        classDocumentation = this.getDocumentationFromInheritCall(argument, varToRequireMap, functionBody);
                        classDocumentation.start = argument.range[0];
                        return classDocumentation;

                    } else if (argument.type === CONST.Identifier) {

                        var varName = argument.name;
                        // search for inherit assignment to varName
                        // either in variable declaration

                        for (var j = 0; j < functionBody.body.length; j++) {
                            statement = functionBody.body[j];

                            if (statement.type === CONST.VariableDeclaration) {
                                for (var k = 0; k < statement.declarations.length; k++) {
                                    var declaration = statement.declarations[k];

                                    if (declaration.type === CONST.VariableDeclarator &&
                                        declaration.id.type === CONST.Identifier && declaration.id.name === varName) {
                                        // found the variable declaration

                                        var value = declaration.init;

                                        if (!value) {
                                            // assignment happens later -> search for assignment
                                            for (var l = 0; l < functionBody.body.length; l++) {
                                                statement = functionBody.body[l];

                                                if (statement.type === CONST.ExpressionStatement &&
                                                    statement.expression.type === CONST.AssignmentExpression &&
                                                    statement.expression.operator === "=" &&
                                                    statement.expression.left.type === CONST.Identifier &&
                                                    statement.expression.left.name === varName) {

                                                    // found the variable assignment
                                                    value = statement.expression.right;
                                                    break;
                                                }
                                            }
                                        }

                                        classDocumentation = this.getDocumentationFromInheritCall(value, varToRequireMap, functionBody);
                                        if (classDocumentation) {
                                            classDocumentation.start = declaration.range[0];
                                            return classDocumentation;
                                        }
                                    }

                                }
                            } else {
                                // TODO: PROCESS static type assignments
                            }

                        }

                        return classDocumentation;

                    }

                }
            }

        },

        getDocumentationFromInheritCall: function (argument, varToRequireMap, scope) {
            if (argument.callee.property.type === CONST.Identifier &&
                argument.callee.property.name === 'inherit') {
                // we found the inherit

                var classDocumentation = this.getClassDocumentationFromInherit(argument.arguments, scope);

                if (classDocumentation) {
                    var inheritFromName = argument.callee.object.name;
                    if (varToRequireMap.hasOwnProperty(inheritFromName)) {
                        classDocumentation.inherit = classDocumentation.inherit || this.getFqClassNameFromPath(varToRequireMap[inheritFromName]);
                    }
                }

                return classDocumentation;
            }

            return null;
        },

        getClassDocumentationFromInherit: function (fnArguments, scope) {

            var fqClassName,
                argument,
                documentation;

            if (!(fnArguments && fnArguments.length)) {
                // no fnArguments passed
                return;
            }

            argument = fnArguments.shift();

            if (argument.type === CONST.Literal) {
                // we found the fqClassName
                fqClassName = argument.value;
                argument = fnArguments.shift();
            }

            if (argument && argument.type === CONST.ObjectExpression) {
                // we found the prototype definition
                documentation = this.getDocumentationFromObject(argument);
            } else if (argument && argument.type === CONST.CallExpression &&
                argument.callee.object.name === "_" && argument.callee.property.name === "extend") {

                // inherit from extended objections
                var extendedProperties = {},
                    object = {
                        type: CONST.ObjectExpression,
                        properties: [],
                        range: [
                            0, 0
                        ]
                    },
                    firstExtend = true;

                for (var i = 0; i < argument.arguments.length; i++) {
                    var extendObject = argument.arguments[i];

                    if (extendObject.type === CONST.Identifier) {

                        var varName = extendObject.name;

                        // search for the Object
                        for (var j = 0; j < scope.body.length; j++) {
                            var statement = scope.body[j];

                            if (statement.type === CONST.VariableDeclaration) {

                                for (var k = 0; k < statement.declarations.length; k++) {
                                    var declaration = statement.declarations[k];

                                    if (declaration.type === CONST.VariableDeclarator && declaration.id.name === varName
                                        && declaration.init.type === CONST.ObjectExpression) {
                                        // found the var -> go through the properties

                                        if (firstExtend) {
                                            object.range = declaration.init.range;
                                            firstExtend = false;
                                        } else {
                                            object.range[1] = declaration.init.range[1];
                                        }

                                        for (var l = 0; l < declaration.init.properties.length; l++) {
                                            var property = declaration.init.properties[l];

                                            extendedProperties[property.key.name] = property;
                                        }
                                    }
                                }

                            }
                        }
                    }
                }


                for (var key in extendedProperties) {
                    if (extendedProperties.hasOwnProperty(key)) {
                        object.properties.push(extendedProperties[key]);
                    }
                }

                documentation = this.getDocumentationFromObject(object);

            }

            if (documentation) {
                documentation.fqClassName = fqClassName;
                return documentation;
            }
        },

        getDocumentationFromObject: function (object) {

            var documentation = {
                    methods: {},
                    defaults: {},
                    properties: {}
                },
                properties = object.properties,
                lastProperty,
                property,
                item, paramMap,
                annotationFrom,
                annotationTo,
                annotations,
                annotationMethods,
                self = this;

            for (var i = 0; i < properties.length; i++) {
                lastProperty = properties[i - 1];
                property = properties[i];
                item = null;
                paramMap = {};
                annotations = null;
                annotationMethods = [];

                annotationFrom = lastProperty ? lastProperty.range[1] : object.range[0];
                annotationTo = property.range[0];

                if (property.value.type === CONST.CallExpression) {

                    var result = getMethodDefinitionWithAnnotations(property.value);

                    parseMethodDocumentation(property.key.name, result.method, result.annotations);

                } else if (property.value.type === CONST.FunctionExpression) {
                    parseMethodDocumentation(property.key.name, property.value);
                } else if (property.key.type === CONST.Identifier && property.key.name === "defaults" && property.value.type === CONST.ObjectExpression) {
                    // found the defaults block

                    documentation.defaults = this.getDefaultValues(property.value);

                } else if (property.key.type === CONST.Identifier && property.key.name === "events" && property.value.type === CONST.ArrayExpression) {
                    // TODO: read events
                } else if (property.key.type === CONST.Identifier && property.key.name === "schema" && property.value.type === CONST.ObjectExpression) {
                    // TODO: read schema
                } else if (property.key.type === CONST.Identifier && property.key.name === "inject" && property.value.type === CONST.ObjectExpression) {
                    // TODO: read injection
                } else if (property.key.type === CONST.Identifier) {
                    annotations = this.getAnnotationInRange(annotationFrom, annotationTo, this.propertyAnnotationProcessors);
                    documentation.properties[property.key.name] = this.getPropertyDocumentation(property, annotations);
                }

            }

            return documentation;

            function parseMethodDocumentation(name, value, methodAnnotations) {

                item = {
                    type: 'Method',
                    parameter: [],
                    annotations: {}
                };

                for (var j = 0; j < value.params.length; j++) {
                    var param = {
                        name: value.params[j].name
                    };

                    paramMap[value.params[j].name] = param;
                    item.parameter.push(param)
                }

                annotations = self.getAnnotationInRange(annotationFrom, annotationTo, self.prototypeAnnotationProcessors);

                for (var a = 0; a < annotations.length; a++) {
                    var annotation = annotations[a];
                    annotation.processor.mapAnnotationToItem(annotation, item, annotations);
                }

                if (methodAnnotations) {
                    for (var i = 0; i < methodAnnotations.length; i++) {
                        var methodAnnotation = methodAnnotations[i],
                            annotationName = methodAnnotation.name,
                            methodAnnotationProcessor = self.methodAnnotationProcessors[annotationName];

                        if (methodAnnotationProcessor) {

                            var annotationItem = item.annotations[annotationName] = item.annotations[annotationName] || [];
                            methodAnnotationProcessor.parse(methodAnnotation, annotationItem);

                        } else {
                            console.warn("No MethodAnnotationProcessor for " + annotationName + " found.");
                        }
                    }
                }

                if (!item.hasOwnProperty('ignore')) {
                    documentation.methods[name] = item;
                }

            }

            function getMethodDefinitionWithAnnotations(object) {

                var annotations = [
                        {
                            name: object.callee.property.name,
                            arguments: object.arguments
                        }
                    ],
                    method;

                if (object.callee.object.type === CONST.CallExpression) {
                    // another method annotation
                    var sub = getMethodDefinitionWithAnnotations(object.callee.object);

                    method = sub.method;
                    annotations = annotations.concat(sub.annotations);

                } else if (object.callee.object.type === CONST.FunctionExpression) {
                    // we found the method
                    method = object.callee.object;
                }

                return {
                    annotations: annotations,
                    method: method
                }

            }

        },

        getVisibility: function (name) {
            return /^[$_]/.test(name) ? "private" : "public";
        },

        getPropertyDocumentation: function (property, annotations) {

            var name = property.key.name,
                ret = {
                    name: name,
                    visibility: this.getVisibility(name)
                };

            if (property.value.type === CONST.Literal) {
                ret.value = property.value.raw;
                ret.propertyType = "value";
            } else {
                ret.propertyType = "complex";
                ret.value = this.code.substring(property.range[0] + name.length + 1, property.range[1]);
            }

            for (var a = 0; a < annotations.length; a++) {
                var annotation = annotations[a];
                annotation.processor.mapAnnotationToItem(annotation, ret, annotations);
            }

            return ret;
        },

        getDefaultValues: function (defaultsObject) {

            var defaults = defaultsObject.properties,
                ret = {},
                lastDefaultEntry;

            for (var i = 0; i < defaults.length; i++) {
                var defaultEntry = defaults[i],
                    defaultName,
                    isValueDefault = defaultEntry.value.type === CONST.Literal;

                if (defaultEntry.key.type === CONST.Identifier) {
                    defaultName = defaultEntry.key.name
                } else if (defaultEntry.key.type === CONST.Literal) {
                    defaultName = defaultEntry.key.value;
                } else {
                    console.warn("couldn't determinate the name for the default");
                }

                lastDefaultEntry = defaults[i - 1];

                var item = {
                    name: defaultName,
                    defaultType: isValueDefault ? "value" : "factory",
                    visibility: this.getVisibility(defaultName),
                    value: isValueDefault ? defaultEntry.value.value : undefined
                };

                var annotations = this.getAnnotationInRange(lastDefaultEntry ? lastDefaultEntry.range[1] : defaultsObject.range[0], defaultEntry.range[0], this.defaultAnnotationProcessors);

                for (var a = 0; a < annotations.length; a++) {
                    var annotation = annotations[a];
                    annotation.processor.mapAnnotationToItem(annotation, item, annotations);
                }

                if (!item.hasOwnProperty('ignore')) {
                    ret[defaultName] = item;
                }

            }

            return ret;

        },

        getAnnotationInRange: function (from, to, processors) {
            var comments = this.getCommentsInRange(from, to),
                ret = [],
                lines = [];

            for (var i = 0; i < comments.length; i++) {
                var comment = comments[i];

                if (comment.type === 'Block') {
                    lines = comment.value.split(/\n/g);
                    lines.shift();
                    lines.pop();
                } else {
                    lines.push(comment.value);

                    if (comments[i + 1] && comments[i + 1].type === 'Line') {
                        // add next lines
                        continue;
                    }
                }

                var lastAnnotationProcessor = null,
                    lastResult = null;

                for (var j = 0; j < lines.length; j++) {
                    var line = lines[j],
                        lineProcessed = false;


                    if (lastAnnotationProcessor && !hasAnnotationDefinition.test(line)) {
                        // no @ found -> use last annotation type
                        lastAnnotationProcessor.appendToResult(lastResult, line.replace(stripLineStart, ''));
                        lineProcessed = true;
                    } else {
                        for (var k = 0; k < processors.length; k++) {

                            var annotationProcessor = processors[k];
                            var result = annotationProcessor.parse(line);

                            if (result) {
                                lastResult = result;
                                lastAnnotationProcessor = annotationProcessor;
                                lineProcessed = true;
                                ret.push(result);

                                // do not process with other processors
                                break;
                            }
                        }
                    }

                    if (!lineProcessed) {
                        console.warn("Did not processed line '" + line + "'.");
                    }
                }

                lines = [];

            }

            return ret;

        },

        getCommentsInRange: function (from, to) {
            var ret = [];

            for (var i = 0; i < this.ast.comments.length; i++) {
                var comment = this.ast.comments[i];
                if (comment.range[0] >= from && comment.range[1] <= to) {
                    ret.push(comment);
                }
            }

            return ret;
        },

        getFqClassNameFromPath: function (name) {
            // TODO: check if some paths are mapped
            // stripe plugin and change / to .
            return name.replace(/^[a-z/]+!]/, '').replace(/\//g, '.').replace("xaml!", "");
        }
    }),

    XamlClassDocumentationProcessor = inherit({

        generate: function (code, fqClassName) {

            var xml = this.xml = new DomParser().parseFromString(code, "text/xml").documentElement,
                definition = {
                    fqClassName: fqClassName,
                    // TODO: load xaml plugin and reuse find dependencies method
                    dependencies: [],
                    type: "xml"
                };

            // TODO: keep track of rewrite map
            definition.inherit = xml.namespaceURI + "." + xml.localName;

            definition.dependencies.push(definition.inherit);

            return [
                new ClassDocumentation(definition)
            ];

        }
    });


Documentation.AnnotationProcessor = inherit.Base.inherit({

    parse: function (line) {
    },

    mapAnnotationToItem: function (annotation, item, annotations) {
    }

});

Documentation.MethodAnnotionProcessor = inherit.Base.inherit({
    parse: function(annotation, methodAnnotionObject) {
    }
});

Documentation.Processors = {};

Documentation.Processors.General = Documentation.AnnotationProcessor.inherit({

    ctor: function (type, many) {
        this.type = type;
        this.many = many;
    },

    parse: function (line) {

        var result = Documentation.Processors.General.Parser.exec(line),
            self = this;

        if (result && result[1] === this.type) {

            return {
                type: this.type,
                processor: self,
                value: result[2]
            }
        }
    },

    appendToResult: function (result, description) {
        result.value += description;
    },

    mapAnnotationToItem: function (annotation, item, annotations) {
        if (this.many) {
            item[this.type] = item[this.type] || [];
            item[this.type].push(annotation.value);
        } else {
            item[this.type] = annotation.value;
        }
    }
}, {
    Parser: /^\s*\*\s*@(\S+)\s*([\s\S]*)\s*$/
});


Documentation.Processors.Class = Documentation.AnnotationProcessor.inherit({
    parse: function (line) {

        var result = Documentation.Processors.Class.Parser.exec(line);

        if (result) {

            result.shift();

            return {
                type: 'fqClassName',
                processor: this,
                value: result[0]
            }
        }
    },

    appendToResult: function (result, description) {
        return false;
    },

    mapAnnotationToItem: function (annotation, item, annotations) {
        item.fqClassName = annotation.value;
    }
}, {
    Parser: /^\s*\*\s*@class\s*(\S+)\s*$/
});

Documentation.Processors.Parameter = Documentation.AnnotationProcessor.inherit({
    parse: function (line) {

        var result = Documentation.Processors.Parameter.Parser.exec(line);

        if (result) {

            result.shift();

            return {
                type: 'parameter',
                processor: this,
                value: {
                    types: result[0] ? result[0].split('|') : null,
                    name: result[1] || result[2],
                    optional: !!result[2],
                    defaultValue: result[3],
                    description: result[4]
                }
            }
        }
    },

    appendToResult: function (result, description) {
        result.value.description += description;

        if (!/\\\s*$/.test(description)) {
            result.value.description += "\n";
        }

    },

    mapAnnotationToItem: function (annotation, item, annotations) {
        item.parameter = item.parameter || [];

        for (var i = 0; i < item.parameter.length; i++) {
            var parameter = item.parameter[i];

            if (parameter.name === annotation.value.name) {
                item.parameter[i] = annotation.value;
                return;
            }
        }

        console.warn('Could find parameter for annotation ' + annotation.value.name);

    }
}, {
    Parser: /\*\s{0,4}@param\s+?(?:\{(.+)?\})?\s*(?:([^[ ]+)|(?:\[([^=]+)(?:=(.*)?)?\]))\s*-?\s*(.+)?$/
});

Documentation.Processors.Type = Documentation.AnnotationProcessor.inherit({
    parse: function (line) {

        var result = Documentation.Processors.Type.Parser.exec(line);

        if (result) {

            result.shift();

            return {
                type: 'type',
                processor: this,
                value: {
                    types: result[0] ? result[0].split('|') : null
                }
            }
        }
    },

    appendToResult: function () {
    },

    mapAnnotationToItem: function (annotation, item, annotations) {
        item.types = item.types || [];

        for (var i = 0; i < annotation.value.types.length; i++) {
            var type = annotation.value.types[i];
            if (_.indexOf(item.types, type) === -1) {
                item.types.push(type);
            }
        }

    }
}, {
    Parser: /\*\s{0,4}@type\s+?\{?([^}]+)?\}?\s*?$/
});

Documentation.Processors.Return = Documentation.AnnotationProcessor.inherit({
    parse: function (line) {
        var result = Documentation.Processors.Return.Parser.exec(line);

        if (result) {

            result.shift();

            return {
                type: 'return',
                processor: this,
                value: {
                    types: result[0] ? result[0].split('|') : null,
                    description: result[1]
                }
            }
        }
    },

    appendToResult: function (result, description) {
        result.value.description += description;
    },

    mapAnnotationToItem: function (annotation, item, annotations) {
        item.returns = annotation.value;
    }
}, {
    Parser: /\*\s{0,4}@return[s]?\s+?(?:\{(.+)?\})?\s*-?\s*(.+)?$/
});

Documentation.Processors.Description = Documentation.AnnotationProcessor.inherit({
    parse: function (line) {

        var result = Documentation.Processors.Description.Parser.exec(line);

        if (result) {

            result.shift();

            return {
                type: 'description',
                processor: this,
                value: {
                    description: result[0]
                }
            }
        } else if (!hasAnnotationDefinition.test(line)) {
            // line without annotation -> it's a description
            return {
                type: 'description',
                processor: this,
                value: {
                    description: line.replace(stripLineStart, '')
                }
            }
        }
    },

    appendToResult: function (result, description) {
        result.value.description += "\n" + description;
    },

    mapAnnotationToItem: function (annotation, item) {
        item.description = annotation.value.description;
    }
}, {
    Parser: /\*\s*@description\s*(.+)$/
});

Documentation.Processors.ArrayMethodAnnotationProcessor = Documentation.MethodAnnotionProcessor.inherit({

    ctor: function(name) {
        this.name = name;
    },

    parse: function (annotation, methodAnnotationObject) {

        for (var i = 0; i < annotation.arguments.length; i++) {
            methodAnnotationObject.push(annotation.arguments[i].value);
        }

    }
});

Documentation.Processors.OnMethodAnnotationProcessor = Documentation.MethodAnnotionProcessor.inherit({
    parse: function (annotation, methodAnnotationObject) {

        for (var i = 0; i < annotation.arguments.length; i++) {
            var arg = annotation.arguments[i];

            if (arg.type === CONST.Literal) {
                methodAnnotationObject.push(["this", arg.value]);
            } else if (arg.type === CONST.ArrayExpression) {
                methodAnnotationObject.push([arg.elements[0].value, arg.elements[1].value]);
            }
        }

    }
});


exports.version = '0.1.0';
exports.Documentation = Documentation;
