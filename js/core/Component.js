define(["require", "js/core/Element", "js/core/TextElement", "underscore"],

    function (require, Element, TextElement, _) {

        var FactoryCache = {},
            TextElementFactory,
            LocalNameCache = {};

        var Component = Element.inherit("js.core.Component", {
            /***
             * @param attributes The attributes of the component
             * @param {Node} descriptor
             * @param {js.core.Stage} stage
             * @param {Element} parentScope
             * @param {Element} rootScope
             * @param {Boolean} [evaluateBindingsInCtor] - default false
             */
            ctor: function (attributes, descriptor, stage, parentScope, rootScope, cidScope, evaluateBindingsInCtor) {

                this.$eventDefinitions = [];
                this.$internalDescriptors = [];
                this.$xamlDefaults = {};
                this.$xamlAttributes = {};

                var current = this,
                    lastDescriptor;
                while (current) {
                    if (current._$descriptor && lastDescriptor != current._$descriptor) {
                        this.$internalDescriptors.unshift(current._$descriptor);
                        _.defaults(this.$xamlDefaults, this._getAttributesFromDescriptor(current._$descriptor, rootScope, cidScope));
                        lastDescriptor = current._$descriptor;
                    }
                    current = current.base;
                }

                attributes = attributes || {};

                var internalCid = this.$xamlDefaults.cid;
                if (internalCid) {
                    // internal cid
                    attributes[internalCid] = this;
                    this.$classAttributes = this.$classAttributes || [];
                    this.$classAttributes.push(internalCid);
                }

                if (descriptor) {
                    this.$xamlAttributes = this._getAttributesFromDescriptor(descriptor, rootScope, cidScope);
                }

                this.$children = [];
                this.$templates = {};
                this.$configurations = [];
                this.$children = [];

                _.defaults(attributes, this.$xamlAttributes, this.$xamlDefaults);
                // added parameters, otherwise it comes to problems in Chrome!
                this.callBase(attributes, descriptor, stage, parentScope, rootScope, cidScope, evaluateBindingsInCtor);
            },

            defaults: {
                /***
                 * the cid is a unique identifier for the component within a xaml class. \
                 * The corresponding component will be automatically added to the $ of the instance of the xaml class.
                 *
                 * @type String
                 */
                cid: undefined
            },

            $errorAttribute: null,
            /**
             * if set all children from the descriptor will be placed into a
             * js.core.Content block with the name of $defaultContentName
             */
            $defaultContentName: null,

            $defaultTemplateName: null,

            /**
             * @name Component#ontest
             * @event
             * @param {Event} e Custom Event
             * @param {String} e.$.value Your value
             *
             */
            events: [
            ],


            /**
             * Returns the ENVIRONMENT object
             * @return {js.core.Bindable}
             */
            ENV: function () {
                return this.$stage.$environment;
            },

            /***
             * Returns the start parameter of the application
             * @return {Object}
             */
            PARAMETER: function () {
                return this.$stage.$parameter;
            },

            /***
             * provides access to the MessageBus
             * @return {js.core.MessageBus}
             */
            bus: function () {
                return this.$stage.$bus;
            },

            _preinitialize: function () {
                this.callBase();
                this._setUp();
            },

            _initializeBindingsBeforeComplete: function () {
                for (var c = 0; c < this.$children.length; c++) {
                    this.$children[c]._initializeBindings();
                }

                this.callBase();
            },

            /***
             * adds a children
             * @param {js.core.Element} child
             */
            addChild: function (child, options) {
                if (!(child instanceof Element)) {
                    throw "only children of type js.core.Component can be added";
                }

                if (this.$initializing || this.$initialized) {
                    // initialize auto

                    child.$parent = this;
                    if (child.$cidScope && child.$.cid) {
                        // register component by cid in the root scope
                        child.$cidScope.set(child.$.cid, child);
                    }

                    if (options && options.childIndex != null) {
                        this.$children.splice(options.childIndex, 0, child);
                    } else {
                        this.$children.push(child);
                    }

                    if (this.$creationPolicy === "auto") {
                        child._initialize(this.$creationPolicy);
                    }


                    // handle special elements
                    if (child instanceof Component.Template) {
                        this._addTemplate(child);
                    } else if (child instanceof Component.Configuration) {
                        this._addConfiguration(child);
                    }
                } else {
                    this.$unitializedChildren = this.$unitializedChildren || [];
                    this.$unitializedChildren.push(child);
                }
            },

            removeChild: function (child) {
                if (!(child instanceof Element)) {
                    throw "only children of type js.core.Component can be removed";
                }

                var index = this.$children.indexOf(child);
                if (index != -1) {
                    // child found
                    child.$parent = null;
                    this.$children.splice(index, 1);
                }

                if (index !== -1) {
                    this.$configurations.splice(index, 1);
                }

                if (this.$templates.hasOwnProperty(child.$.name)) {
                    // remove it from templates
                    delete this.$templates[child.$.name];
                }
            },

            removeAllChildren: function () {
                for (var i = this.$children.length - 1; i > -1; i--) {
                    this.removeChild(this.$children[i]);
                }
            },

            _addTemplate: function (template) {
                if (!template.$.name) {
                    throw "template without name";
                }
                this.$templates[template.$.name] = template;
            },

            _addConfiguration: function (config) {
                this.$configurations.push(config);
            },

            /***
             * Goes up the tree and searches for a template component with the given name.
             * Returns null if no template was found.
             * @param {String} name
             * @return {js.core.Template}
             */
            getTemplate: function (name) {
                var tpl = this.$templates[name];
                if (tpl) {
                    return tpl;
                } else if (this.$parent && this.$parent !== this) {
                    return this.$parent.getTemplate(name);
                } else {
                    return null;
                }
            },

            _initializeChildren: function (childComponents) {
                for (var i = 0; i < childComponents.length; i++) {
                    // add the children
                    this.addChild(childComponents[i]);
                }
            },

            /***
             *
             * @param attributes
             */
            _initializeAttributes: function (attributes) {
                this.callBase();

                if (this.$creationPolicy !== "full" && (attributes.hasOwnProperty("creationPolicy"))) {
                        this.$creationPolicy = attributes.creationPolicy;
                        delete attributes.creationPolicy;
                }

            },

            /***
             *  Initializes all internal and external descriptors
             */
            _initializeDescriptors: function () {
                var children = [],
                    addedDescriptors = [],
                    i, child;

                if (this.$defaultContentName && this.$defaultTemplateName) {
                    throw "both $defaultContentName and $defaultTemplateName are defined";
                }

                var desc;

                function addChildren(childrenFromDescriptor, fromDescriptor) {

                    // don't add children with the same descriptor twice
                    for (var j = 0; j < childrenFromDescriptor.length; j++) {
                        child = childrenFromDescriptor[j];
                        child.$fromDescriptor = fromDescriptor;

                        if (child.$createdByTemplate || _.indexOf(addedDescriptors, child.$descriptor) === -1) {
                            children.push(child);
                            if (child.$descriptor) {
                                addedDescriptors.push(child.$descriptor);
                            }
                        }
                    }
                }

                for (var d = 0; d < this.$internalDescriptors.length; d++) {
                    desc = this.$internalDescriptors[d];
                    addChildren(this._getChildrenFromDescriptor(desc, this, null, this), "intern");
                }

                var externalDescriptorChildren;

                if (this.$defaultTemplateName) {
                    var templateBlock;

                    // go through all children from the external descriptor
                    // and check if a template block with the name $defaultTemplateName

                    for (i = 0; i < this.$descriptor.childNodes.length; i++) {
                        var node = this.$descriptor.childNodes[i];

                        if (node.nodeType === 1 &&
                            node.getAttribute("name") === this.$defaultTemplateName &&
                            this.$stage.$applicationContext.getFqClassName(node.namespaceURI, this._localNameFromDomNode(node), true) === "js/core/Template") {

                            templateBlock = node;
                            break;
                        }
                    }

                    if (!templateBlock && this.$descriptor) {
                        templateBlock = this.createComponent(Component.Template, {
                            name: this.$defaultTemplateName
                        }, this.$descriptor);

                        externalDescriptorChildren = [templateBlock];
                    }

                }

                externalDescriptorChildren = externalDescriptorChildren || this._getChildrenFromDescriptor(this.$descriptor);


                if (this.$defaultContentName && this.$descriptor) {
                    // check if content block is already defined
                    var contentBlock,
                        internAndExternalChildren = children.concat(externalDescriptorChildren);


                    for (i = 0; i < internAndExternalChildren.length; i++) {
                        child = internAndExternalChildren[i];

                        if (child instanceof Component.Content && child.$.name === this.$defaultContentName) {
                            // content block already defined
                            contentBlock = child;
                            break;
                        }
                    }

                    if (!contentBlock) {
                        // create a content block and move all children in a js.core.Content Block
                        contentBlock = this.createComponent(Component.Content, {
                            name: this.$defaultContentName
                        });

                        // add all children to content block
                        for (i = 0; i < externalDescriptorChildren.length; i++) {
                            contentBlock.addChild(externalDescriptorChildren[i]);
                        }

                        externalDescriptorChildren = [contentBlock];
                    }

                }

                addChildren(externalDescriptorChildren, "external");

                var extraChildren = this.createChildren();
                if (extraChildren) {
                    addChildren(extraChildren, "extra");
                }

                this._initializeChildren(children);

                this._childrenInitialized();

                this._initializeXamlEventAttributes(this.$xamlDefaults, this);
                this._initializeXamlEventAttributes(this.$xamlAttributes, this.$rootScope);
            },

            createChildren: function () {
                if (this.$unitializedChildren) {
                    var ret = [];
                    while (this.$unitializedChildren.length) {
                        ret.push(this.$unitializedChildren.shift());
                    }
                    return ret;
                }
            },

            _cleanUpDescriptor: function (desc) {
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

                        }
                    }
                } else {
                    this.log("Descriptor not defined or not correct", "warn");
                }
            },

            _isEventAttribute: function (attributeName) {
                return attributeName.indexOf("eventHandler:") === 0;
            },


            _isFunctionAttribute: function (attributeName) {
                return attributeName.indexOf("function:") === 0;
            },

            _isXamlEventAttribute: function (attributeName) {
                return attributeName.indexOf("on") === 0;
            },

            _getEventName: function (eventDefinition) {
                return eventDefinition.substr(3);
            },

            /**
             * Returns true if event is defined in Component event list
             * @param event
             */
            _isComponentEvent: function (event) {
                for (var i = 0; i < this.events.length; i++) {
                    if (event === this.events[i]) {
                        return true;
                    }
                }
                return false;
            },

            _getEventTypeForAttribute: function (eventName) {
                // TODO: implement eventAttribites as hash
                return this._eventAttributes[eventName];
            },

            _initializeXamlEventAttributes: function (attributes, rootScope) {
                var event = '',
                    callback,
                    value,
                    realValue;
                for (var key in attributes) {
                    if (attributes.hasOwnProperty(key)) {
                        value = attributes[key];

                        if (this._isXamlEventAttribute(key)) {
                            var index = value.indexOf("(");
                            if (index > 0) {
                                realValue = value.substr(0, index);
                            } else {
                                realValue = value;
                            }

                            if (rootScope[realValue]) {
                                event = key.substr(2);

                                callback = rootScope[value];
                                this.bind("on:" + event, index > 0 ? value : rootScope[value], rootScope);
                            } else {
                                throw "Couldn't find callback " + value + " for " + key + " event";
                            }
                        } else if (this._isEventAttribute(key)) {
                            this.bind(key.split(":")[1], rootScope[value], rootScope);
                        }
                    }
                }
            },


            /***
             * Create {@link Component} for DOM Node with given attributes
             * @param {DOM} node
             * @param [attributes] for new Component
             * @param rootScope
             */
            _createComponentForNode: function (node, attributes, rootScope, cidScope) {
                if (!node) {
                    return null;
                }

                attributes = attributes || {};
                rootScope = rootScope || this.$rootScope;
                cidScope = cidScope || this.$cidScope;
                // only instantiation and construction but no initialization


                var instance = null;

                if (node.nodeType === 1) { // Elements
                    var namespaceURI = node.namespaceURI,
                        localName = this._localNameFromDomNode(node),
                        cacheKey = namespaceURI + ":" + localName,
                        factory = FactoryCache[cacheKey];

                    if (factory) {
                        instance = new factory(attributes, node, this.$stage, this, rootScope, cidScope, true);
                    } else {
                        var fqClassName = this.$stage.$applicationContext.getFqClassName(namespaceURI, localName, true);
                        var className = this.$stage.$applicationContext.getFqClassName(namespaceURI, localName, false);
                        instance = this.$stage.$applicationContext.createInstance(fqClassName, [attributes, node, this.$stage, this, rootScope, cidScope, true], className);
                        FactoryCache[cacheKey] = instance.factory;
                    }

                } else if (node.nodeType === 3 || node.nodeType === 4) {
                    // Text nodes
                    instance = this._createTextElement(node, rootScope, cidScope, attributes);
                }

                return instance;
            },

            /***
             *
             * @param {Function} factory
             * @param {Object} [attributes]
             * @param [descriptor=false]
             * @return {*}
             */
            createComponent: function (factory, attributes, descriptor) {
                descriptor = descriptor || false;
                attributes = attributes || [];
                if (factory instanceof Function) {
                    return new factory(attributes, descriptor, this.$stage, this, this.$rootScope, this.$cidScope, true);
                }
                return this.$stage.$applicationContext.createInstance(factory, [attributes, descriptor, this.$stage, this, this.$rootScope, this.$cidScope, true]);
            },

            createBinding: function (path, callback, callbackScope) {
                callbackScope = callbackScope || this;
                this.$bindingCreator.evaluate(path, this, function () {
                    callback.apply(callbackScope, arguments);
                });
            },

            _createTextElement: function (node, rootScope, cidScope, attributes) {
                if (TextElementFactory) {
                    return new TextElementFactory(attributes, node, this.$stage, this, rootScope, cidScope, true);
                }
                var instance = this.$stage.$applicationContext.createInstance('js/core/TextElement', [attributes, node, this.$stage, this, rootScope, cidScope, true]);
                TextElementFactory = instance.factory;
                return instance;

            },

            /***
             * Converts all child nodes of a descriptor to instances of Components or TextElement
             * @param descriptor
             * @param attributes
             * @param rootScope
             * @param cidScope
             */
            _getChildrenFromDescriptor: function (descriptor, rootScope, attributes, cidScope) {
                var childrenFromDescriptor = [], node, component;

                if (descriptor && descriptor.childNodes) {
                    for (var i = 0; i < descriptor.childNodes.length; i++) {
                        node = descriptor.childNodes[i];
                        component = this._createComponentForNode(node, _.clone(attributes), rootScope, cidScope);
                        if (component) {
                            childrenFromDescriptor.push(component);
                        }
                    }
                }

                return childrenFromDescriptor;
            },
            /***
             * @private
             * This method is called after all children are initialized
             */
            _childrenInitialized: function () {

            },
            /***
             * This method should overridden by custom components to set initial variables
             * @param scope
             */
            initialize: function (scope) {
            },

            /**
             * determinate the local-name of a DomNode
             *
             * @param domNode
             */
            _localNameFromDomNode: function (domNode) {
                if (domNode.localName) {
                    return domNode.localName;
                }

                var localName = LocalNameCache[domNode.tagName];
                if (localName) {
                    return localName;
                }
                var st = domNode.tagName.split(":");

                LocalNameCache[domNode.tagName] = st[st.length - 1];


                return LocalNameCache[domNode.tagName];
            },

            baseUrl: function (path) {
                path = path || "";

                if (this.$stage) {
                    path = (this.$stage.$applicationContext.$config.baseUrl || "") + path;
                }

                return path;
            }
        });

        /***
         * @summary A template a xaml descriptor components are created from during runtime
         *
         * @description Templates are used to define repeatable elements, like the view of a renderer
         * in a list. The name of the template is unique and is required.
         *
         * Components with defined $defaultTemplateName are creating template descriptors dynamically based on the
         * children.
         *
         */
        Component.Template = Component.inherit("js.core.Template", {

            defaults: {
                /***
                 * the name of the template
                 * @required
                 */
                name: null
            },

            _initializeDescriptors: function () {
                this._childrenInitialized();
            },

            createComponents: function (attributes, parentScope, cidScope) {
                parentScope = parentScope || this.$parentScope;

                var components = this._getChildrenFromDescriptor(this.$descriptor, null, attributes, cidScope);

                for (var c = 0; c < components.length; c++) {
                    components[c].$createdByTemplate = true;
                    components[c].$parentScope = parentScope;
                }

                return components;
            },

            createInstance: function (attributes, parentScope, cidScope) {
                var components = this.createComponents(attributes, parentScope, cidScope);
                return components[0];
            }
        });

        Component.Configuration = Component.inherit("js.conf.Configuration", {

            /***
             *
             * @param {String} key
             * @param {String} value
             * @param {Boolean} [recursive=true]
             * @return {*}
             */
            getConfigurationByKeyValue: function (key, value, recursive) {

                if (arguments.length < 3) {
                    recursive = true;
                }

                var configuration,
                    i, ret;

                for (i = 0; i < this.$configurations.length; i++) {
                    configuration = this.$configurations[i];

                    if (configuration.$[key] === value) {
                        return configuration;
                    }
                }

                if (recursive) {
                    for (i = 0; i < this.$configurations.length; i++) {
                        configuration = this.$configurations[i];
                        ret = configuration.getConfigurationByKeyValue(key, value);

                        if (ret) {
                            return ret;
                        }
                    }
                }

                return null;
            }
        });

        Component.Content = Component.inherit("js.core.Content", {

            defaults: {
                /***
                 * the name of the content matching the name of the target ContentPlaceHolder
                 * @required
                 * @see js.ui.ContentPlaceHolder
                 */
                name: null
            },

            getChildren: function () {
                var el, children = [];
                for (var i = 0; i < this.$children.length; i++) {
                    el = this.$children[i];
                    if (el instanceof require("js/core/DomElement") || el instanceof TextElement) {
                        children.push(el);
                    }
                }
                return children;
            }
        });

        return Component;
    }
);