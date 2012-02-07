rAppid.defineClass("js.core.Component",
    ["js.core.Element", "js.core.TextElement"],
    function (Element, TextElement, Template) {
        return Element.inherit({
            ctor: function (attributes) {
                this.callBase();
                this.$children = [];

                this.$templates = {};

                // TODO, what is with the attributes ?
            },

            addChild: function (child) {
                if (!(child instanceof Element)) {
                    throw "only children of type js.core.Component can be added"
                }

                child.$parent = this;

                this.$children.push(child);

                if (child.constructor.name == "js.core.Template") {
                    if (!child.$.name) {
                        throw "template without name";
                    }

                    this.$templates[child.$.name] = child;
                }
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

                index = this.$templates.indexOf(child);
                if (index != -1) {
                    // remove it from templates
                    this.$templates.splice(index, 1);
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
                    this.addChild(childComponents[i]);

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
                            this.bind(this._getEventTypeForAttribute(key), this[value], this);
                        } else if (this._isBindingDefinition(value)) {
                            var attrKey = value.match(this._bindingRegex);
                            attributes[key] = this.get(attrKey[1]);
                        }

                    }
                }

            },
            _createComponentForNode: function (node) {
                // only instantiation and construction but no initialization
                var appDomain = this.$applicationDomain;
                var component = appDomain.createInstance(appDomain.getFqClassName(node.namespaceURI, node.localName));

                component._construct(node, appDomain, this, this.$rootScope);

                return component;
            },
            _createTextElementForNode: function (node) {
                // only instantiation and construction but no initialization
                var appDomain = this.$applicationDomain;
                var component = new TextElement();

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
//                        // call initializeScope
//                        if (this.$scopInitialized == false && this.initialize) {
//                            this.$scopInitialized = true;
//                            this.initialize(this.$scope);
//                        }
                    } else if (node.nodeType == 3) { // Textnodes
                        // remove whitespaces from text textnodes
                        var text = node.textContent.trim();
                        if (text.length > 0) {
                            // console.log(node);
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