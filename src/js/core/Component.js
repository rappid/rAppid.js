rAppid.defineClass("js.core.Component",
    ["js.core.Element", "js.core.TextElement", "underscore"],
    function (Element, TextElement, _) {
        return Element.inherit({
            ctor: function (attributes) {

                this.$components = [];

                this.$templates = {};
                this.$configurations = [];
                this.$children = [];

                this.callBase();
            },

            /**
             * values to be injected
             * @key {String} name of the variable for this.$key
             * @value {Required Class}
             */
            inject: {
            },

            _injectChain: function() {
                return this._generateDefaultsChain("inject");
            },

            _preinitialize: function() {
                this.callBase();

                var inject = this._injectChain();

                if (Object.keys(inject).length > 0) {
                    // we need to inject at least on item

                    // synchronous singleton instantiation of Injection,
                    // because if module requires injection, application also depends on
                    // Injection.js and class should be installed.


                    var injection = this.$applicationDomain.createInstance("js.core.Injection");
                    for (var name in inject) {
                        if (inject.hasOwnProperty(name)) {
                            this["$" + name] = injection.getInstance(inject[name]);
                        }
                    }
                }

            },

            addComponent: function(component) {
                if (!component) {
                    throw "component null";
                }

                this.$components.push(component);

                if (this.$rootScope && component.$.cid) {
                        // register component by cid in the root scope
                        this.$rootScope.set(component.$.cid, component);
                }
            },

            removeComponent: function(component) {
                // TODO: implement and remove cid from rootscope
            },

            addChild: function (child) {
                if (!(child instanceof Element)) {
                    throw "only children of type js.core.Component can be added"
                }

                this.addComponent(child);

                child.$parent = this;
                this.$children.push(child);

            },

            removeChild: function(child) {
                if (!(child instanceof Element)) {
                    throw "only children of type js.core.Component can be removed"
                }

                var index = this.$children.indexOf(child);
                if (index != -1) {
                    // child found
                    child.$parent = null;
                    this.$children.splice(index, 1);
                }

                if (this.$templates.hasOwnProperty(child.$.name)) {
                    // remove it from templates
                    delete this.$templates[child.$.name];
                }

                index = this.$children.indexOf(child);
                if (index != -1) {
                    this.$configurations.splice(index, 1);
                }

            },

            addTemplate: function(template) {
                if (!template.$.name) {
                    throw "template without name";
                }

                this.addComponent(template);
                this.$templates[template.$.name] = template;
            },

            addConfiguration: function(config) {
                this.addComponent(config);
                this.$configurations.push(config);
            },

            getTemplate: function (name) {
                return this.$templates[name];
            },

            /**
             *
             * @param descriptor
             *          auto - do not overwrite (default),
             *          all - create all children
             *          TODO none?
             */
            _initializeDescriptor: function (descriptor) {
                var childrenFromDescriptor = this._createChildrenFromDescriptor(descriptor);

                this._initializeChildren(childrenFromDescriptor);

                this._childrenInitialized();
            },

            _initializeChildren: function (childComponents) {
                for (var i = 0; i < childComponents.length; i++) {
                    // FIRST ADD CHILD
                    var child = childComponents[i];

                    if (child.constructor.name == "js.core.Template") {
                        this.addTemplate(child);
                    } else if (child.className.indexOf("js.conf") == 0) {
                        this.addConfiguration(child);
                    } else {
                        this.addChild(childComponents[i]);
                    }

                    // THEN INITIALIZE !
                    if (this.$creationPolicy == "auto") {
                        childComponents[i]._initialize(this.$creationPolicy);
                    }
                }
            },
            _initializeAttributes: function (attributes) {
                this.callBase();

                if (this.$creationPolicy != "full") {
                    if (attributes.hasOwnProperty("creationPolicy")) {
                        this.$creationPolicy = attributes.creationPolicy;
                        delete attributes.creationPolicy;
                    }
                }

            },

            _initializeBindings: function() {

                var attributes = this.$;
                // Resolve bindings and events
                for (var key in attributes) {

                    if (attributes.hasOwnProperty(key)) {
                        var value = attributes[key];
                        if (this._isEventAttribute(key)) {
                            this.on(key, this.$rootScope[value], this.$rootScope);
                            delete attributes[key];
                        } else if (this._isBindingDefinition(value)) {
                            var attrKey = value.match(this.$bindingRegex);
                            attrKey = attrKey[1];
                            var scope = this.getScopeForKey(attrKey);
                            if (scope) {
                                var self = this;
                                scope.on('change:' + attrKey, function (e) {
                                    var changed = {};
                                    changed[key] = e.$;
                                    self._commitChangedAttributes(changed);
                                });
                                attributes[key] = scope.get(attrKey);
                                // if is twoWay binding
                                this.on('change:' + key, function (e) {
                                    scope.set(attrKey, e.$);
                                });

                            } else {
                                //  throw "Binding not found";
                            }

                        }

                    }
                }

                for (var c = 0; c < this.$components.length; c++) {
                    this.$components[c]._initializeBindings();
                }
            },

            _createComponentForNode: function (node, attributes) {
                attributes = attributes || [];

                // only instantiation and construction but no initialization
                var appDomain = this.$applicationDomain;

                var fqClassName = appDomain.getFqClassName(node.namespaceURI, node.localName, true);
                var className = appDomain.getFqClassName(node.namespaceURI, node.localName, false);

                return appDomain.createInstance(fqClassName, [attributes, node, appDomain, this, this.$rootScope], className);

            },
            _createTextElementForNode: function (node) {
                // only instantiation and construction but no initialization
                var appDomain = this.$applicationDomain;
                return appDomain.createInstance("js.core.TextElement", [null, node, appDomain, this, this.$rootScope]);

            },
            _createChildrenFromDescriptor: function (descriptor) {

                var childrenFromDescriptor = [], node, component;

                if (descriptor) {
                    for (var i = 0; i < descriptor.childNodes.length; i++) {
                        node = descriptor.childNodes[i];
                        if (node.nodeType == 1) { // Elements
                            component = this._createComponentForNode(node);
                            childrenFromDescriptor.push(component);
                        } else if (node.nodeType == 3) { // Textnodes
                            // remove whitespaces from text textnodes
                            var text = node.textContent.trim();
                            if (text.length > 0) {
                                node.textContent = text;
                                childrenFromDescriptor.push(this._createTextElementForNode(node));
                            }

                        }
                    }
                }

                return childrenFromDescriptor;
            },
            _childrenInitialized: function () {

            },
            initialize:function (scope) {
            }
        });
    }
);