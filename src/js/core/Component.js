rAppid.defineClass("js.core.Component",
    ["js.core.Element", "js.core.TextElement"], function(Element, TextElement) {
        return Element.inherit({
            ctor: function (attributes) {
                this.base.ctor.callBase(this);
                this.$children = [];
            },

            _construct: function(descriptor, applicationDomain) {
                this.$descriptor = descriptor;
                this.$applicationDomain = applicationDomain;
            },

            addChild: function (child) {
                if (!(child instanceof Element)) {
                    throw "only children of type js.core.Component can be added"
                }
                child.$parent = this;
                this.$children.push(child);
            },

            /**
             *
             * @param descriptor
             *          auto - do not overwrite (default),
             *          all - create all children
             *          TODO none?
             */
            _initializeDescriptor: function (descriptor) {
                var node, attrVal;
                var placeholders = {};


                // get attributes from descriptor
                var attributes = this.$ || {};
                if (descriptor && descriptor.attributes) {
                    for (var a = 0; a < descriptor.attributes.length; a++) {
                        node = descriptor.attributes[a];
                        if (node.nodeType == 2) { // attributes
                            attrVal = node.value;
                            // TODO: add proper reg expr for {varName123}
                            var key = attrVal.match(/{([a-zA-Z_\.]+)}/)
                            if (key) {
                                placeholders[node.nodeName] = key[1];
                            } else {
                                attributes[node.nodeName] = attrVal;
                            }

                        }
                    }
                }


                if (this.$creationPolicy != "full") {
                    if (attributes.hasOwnProperty("creationPolicy")) {
                        this.$creationPolicy = attributes.creationPolicy;
                    }
                }


                var childrenFromDescriptor = this._createChildrenFromDescriptor(descriptor);

                this._initializeChildren(childrenFromDescriptor);

                // read out variables and put in attributes
                // after the script tag is evaluated
                for (key in placeholders) {
                    if (placeholders.hasOwnProperty(key)) {


                        var val = this._getPropertyForPlaceholder(placeholders[key]);
                        if (val) {
                            attributes[key] = _.isFunction(val) ? val() : val;
                        }

                    }
                }

                this._initializeAttributes(attributes);

                this._childrenInitialized();

            },
            _initializeChildren: function (childComponents) {
                for (var i = 0; i < childComponents.length; i++) {
                    this.addChild(childComponents[i]);

                    if (this.$creationPolicy == "auto") {
                        childComponents[i]._initialize(this.$creationPolicy);
                    }
                }
            },
            _initializeAttributes: function (attributes) {
                this.set(attributes,{silent: true});
            },
            _createComponentForNode: function (node) {
                // only instantiation and construction but no initialization
                var appDomain = this.$applicationDomain;
                var component = appDomain.createInstance(appDomain.getFqClassName(node.namespaceURI, node.localName));

                component._construct(node, appDomain);

                return component;
            },
            _createComponentForTextNode:function (node) {
                // only instantiation and construction but no initialization
                var appDomain = this.$applicationDomain;
                var component = new TextElement();

                component._construct(node, appDomain);

                return component;
            },
            _createChildrenFromDescriptor: function(descriptor){
                var childrenFromDescriptor = [], node;
                for (var i = 0; i < descriptor.childNodes.length; i++) {
                    node = descriptor.childNodes[i];
                    if (node.nodeType == 1) { // Elements
                        childrenFromDescriptor.push(this._createComponentForNode(node));
                    }else if(node.nodeType == 3){ // Textnodes
                        // remove whitespaces from text textnodes
                        var text = node.textContent.trim();
                        if(text.length > 0){
                            // console.log(node);
                            node.textContent = text;
                            childrenFromDescriptor.push(this._createComponentForTextNode(node));
                        }

                    }
                }
                return childrenFromDescriptor;
            },
            _childrenInitialized: function () {

            }
        });
    }
);