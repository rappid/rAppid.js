rAppid.defineClass("js.core.Component",
    ["js.core.EventDispatcher"], function(EventDispatcher) {
        return EventDispatcher.inherit({

            ctor: function (options) {
                this.base.ctor.callBase(this);
                this.$children = [];
                this.$options = _.defaults(options || {}, this._defaultOptions);
            },

            _defaultOptions: {},

            _construct: function(descriptor, applicationDomain) {
                this.$descriptor = descriptor;
                this.$applicationDomain = applicationDomain;
            },

            addChild: function (child) {
                if (!(child instanceof js.core.Component)) {
                    throw "only children of type js.core.Component can be added"
                }

                this.$children.push(child);
            },

            /**
             *
             * @param descriptor
             * @param creationPolicy
             *          auto - do not overwrite (default),
             *          all - create all children
             *          TODO none?
             */
            _initialize: function (creationPolicy) {
                if (this.$initialized) {
                    return;
                }

                var descriptor = this.$descriptor;


                this._preinitialize();

                var node;

                // get attributes from descriptor
                var attributes = this.$options;
                if (descriptor) {
                    for (var a = 0; a < descriptor.childNodes.length; a++) {
                        node = descriptor.childNodes[a];
                        if (node.nodeType == 2) { // attributes
                            attributes[node.nodeName] = descriptor.getAttribute(node.nodeName);
                        }
                    }
                }


                if (creationPolicy != "full") {
                    if (attributes.hasOwnProperty("creationPolicy")) {
                        creationPolicy = attributes.creationPolicy;
                    } else {
                        creationPolicy = "auto";
                    }
                }

                this.$creationPolicy = creationPolicy;

                this._initializeAttributes(attributes);

                var childrenFromDescriptor = [];

                for (var i = 0; i < descriptor.childNodes.length; i++) {
                    node = descriptor.childNodes[i];
                    if (node.nodeType == 1) { // Elements
                        childrenFromDescriptor.push(this._createComponentForNode(node));
                    }
                }

                this._initializeChildren(childrenFromDescriptor);
                this._childrenInitialized();

                this._initializationComplete();

            },
            _initializeChildren: function (childComponents) {
                for (var i = 0; i < childComponents.length; i++) {

                    if (this.$creationPolicy == "auto") {
                        childComponents[i]._initialize(this.$creationPolicy);
                    }

                    this.addChild(childComponents[i]);
                }
            },
            _preinitialize: function () {
            },
            _initializeAttributes: function (attributes) {
                this.$attributes = attributes;
                
            },
            _createComponentForNode: function (node) {
                // only instantiation and construction but no initialization
                var appDomain = this.$applicationDomain;
                var component = appDomain.createInstance(appDomain.getFqClassName(node.namespaceURI, node.localName));

                component._construct(node, appDomain);

                return component;
            },

            _childrenInitialized: function () {

            },
            _initializationComplete: function () {
                this.$initialized = true;
            }

        });
    }
);