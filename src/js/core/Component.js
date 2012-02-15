rAppid.defineClass("js.core.Component",
    ["js.core.Element", "js.core.TextElement", "underscore"],
    function (Element, TextElement, _) {
        return Element.inherit({
            ctor: function (attributes) {
                this.callBase();

                this.$children = [];

                this.$templates = {};
                this.$configurations = [];

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

            addChild: function (child) {
                if (!(child instanceof Element)) {
                    throw "only children of type js.core.Component can be added"
                }

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
                        if (!child.$.name) {
                            throw "template without name";
                        }
                        this.$templates[child.$.name] = child;
                    } else if (child.className.indexOf("js.conf") == 0) {
                        this.$configurations.push(child);
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
                            if(scope){
                                var self = this;
                                scope.on('change:' + attrKey, function (e) {
                                    var changed = {};
                                    changed[key] = e.$;
                                    self._commitChangedAttributes(changed);
                                });
                                attributes[key] = scope.get(attrKey);
                                // if is twoWay binding
                                this.on('change:'+key,function(e){
                                    scope.set(attrKey,e.$);
                                });

                            }else{
                               //  throw "Binding not found";
                            }

                        }

                    }
                }

            },
            _createComponentForNode: function (node, args) {
                args = args || [];

                // only instantiation and construction but no initialization
                var appDomain = this.$applicationDomain;

                var fqClassName = appDomain.getFqClassName(node.namespaceURI, node.localName, true);
                var className = appDomain.getFqClassName(node.namespaceURI, node.localName, false);

                var component = appDomain.createInstance(fqClassName, args, className);

                component._construct(node, appDomain, this, this.$rootScope);

                return component;
            },
            _createTextElementForNode: function (node) {
                // only instantiation and construction but no initialization
                var appDomain = this.$applicationDomain;
                var component = appDomain.createInstance("js.core.TextElement");

                component._construct(node, appDomain, this, this.$rootScope);

                return component;
            },
            _createChildrenFromDescriptor: function (descriptor) {

                var childrenFromDescriptor = [], node, component;
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
                return childrenFromDescriptor;
            },
            _childrenInitialized: function () {

            },
            initialize:function (scope) {
            }
        });
    }
);