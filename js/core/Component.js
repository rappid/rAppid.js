define(["require", "js/core/Element", "js/core/TextElement", "js/core/Bindable", "js/core/EventDispatcher", "underscore"],

    function (require, Element, TextElement, Bindable, EventDispatcher, _) {

        var Component = Element.inherit("js.core.Component",
            {
                /***
                 * What up??
                 * @param attributes The attributes of the component
                 * @param {String} attributes.style The style of the component
                 * @param {Node} descriptor
                 * @param {js.core.Stage} stage
                 * @param {Element} parentScope
                 * @param {Element} rootScope
                 * @constructs
                 */
                ctor: function (attributes, descriptor, stage, parentScope, rootScope) {
                    this.$eventDefinitions = [];
                    this.$internalDescriptors = [];
                    this.$xamlDefaults = {};
                    this.$xamlAttributes = {};
                    var current = this, last;
                    while (current) {
                        if (current._$descriptor && last != current) {
                            this._cleanUpDescriptor(current._$descriptor);
                            this.$internalDescriptors.unshift(current._$descriptor);

                            _.defaults(this.$xamlDefaults, this._getAttributesFromDescriptor(current._$descriptor));
                        }
                        current = current.base;
                    }

                    if (descriptor) {
                        this._cleanUpDescriptor(descriptor);
                        this.$xamlAttributes = this._getAttributesFromDescriptor(descriptor);
                    }

                    this.$elements = [];
                    this.$templates = {};
                    this.$configurations = [];
                    this.$children = [];

                    attributes = attributes || {};
                    _.extend(attributes, this.$xamlAttributes, this.$xamlDefaults);
                    // added parameters, otherwise it comes to problems in Chrome!
                    this.callBase(attributes, descriptor, stage, parentScope, rootScope);
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
                 * values to be injected
                 * @key {String} name of the variable for this.$key
                 * @value {Required Class}
                 */
                inject: {},
                _injectChain: function () {
                    return this._generateDefaultsChain("inject");
                },
                _preinitialize: function () {
                    this.callBase();

                    this._inject();
                    this._bindBus();
                },

                _bindBus: function () {
                    for (var f in this) {
                        var fn = this[f];
                        if (fn instanceof Function && fn._busEvents) {
                            for (var i = 0; i < fn._busEvents.length; i++) {
                                this.$stage.$bus.bind(fn._busEvents[i], fn, this);
                            }
                        }
                    }
                },

                _inject: function () {

                    var inject = this._injectChain();

                    if (_.keys(inject).length > 0) {
                        // we need to inject at least on item

                        // synchronous singleton instantiation of Injection,
                        // because if module requires injection, application also depends on
                        // Injection.js and class should be installed.
                        var injection = this.$stage.$injection;
                        if (injection) {
                            for (var name in inject) {
                                if (inject.hasOwnProperty(name)) {
                                    this.$[name] = injection.getInstance(inject[name]);
                                }
                            }
                        } else {
                            throw "injection not available in systemManager";
                        }

                    }

                },
                /***
                 * adds a children
                 * @param {js.core.Element} child
                 */
                addChild: function (child, options) {
                    if (!(child instanceof Element)) {
                        throw "only children of type js.core.Component can be added"
                    }

                    if(this.$initializing || this.$initialized){
                        // initialize auto
                        if (this.$creationPolicy === "auto") {
                            child._initialize(this.$creationPolicy);
                        }

                        if (child.$rootScope && child.$.cid) {
                            // register component by cid in the root scope
                            child.$rootScope.set(child.$.cid, child);
                        }

                        child.$parent = this;
                        // save under elements
                        this.$elements.push(child);

                        // handle special elements
                        if (child instanceof Component.Template) {
                            this._addTemplate(child);
                        } else if (child instanceof Component.Configuration) {
                            this._addConfiguration(child);
                        }
                    }else{
                        this.$unitializedChildren = this.$unitializedChildren || [];
                        this.$unitializedChildren.push(child);
                    }
                },

                removeChild: function (child) {
                    if (!(child instanceof Element)) {
                        throw "only children of type js.core.Component can be removed"
                    }

                    var index = this.$elements.indexOf(child);
                    if (index != -1) {
                        // child found
                        child.$parent = null;
                        this.$elements.splice(index, 1);
                    }

                    if (index != -1) {
                        this.$configurations.splice(index, 1);
                    }

                    if (this.$templates.hasOwnProperty(child.$.name)) {
                        // remove it from templates
                        delete this.$templates[child.$.name];
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
                    } else if (this.$parent && this.$parent != this) {
                        return this.$parent.getTemplate(name);
                    } else {
                        return null
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

                    if (this.$creationPolicy != "full") {
                        if (attributes.hasOwnProperty("creationPolicy")) {
                            this.$creationPolicy = attributes.creationPolicy;
                            delete attributes.creationPolicy;
                        }
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

                    function addChildren(childrenFromDescriptor) {

                        // don't add children with the same descriptor twice
                        for (var j = 0; j < childrenFromDescriptor.length; j++) {
                            child = childrenFromDescriptor[j];

                            if (_.indexOf(addedDescriptors, child.$descriptor) === -1) {
                                children.push(child);
                                addedDescriptors.push(child.$descriptor);
                            }
                        }
                    }

                    for (var d = 0; d < this.$internalDescriptors.length; d++) {
                        desc = this.$internalDescriptors[d];
                        addChildren(this._getChildrenFromDescriptor(desc, this));
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
                            templateBlock = this.createComponent(Template, {
                                name: this.$defaultTemplateName
                            }, this.$descriptor);

                            externalDescriptorChildren = [templateBlock];
                        }

                    }

                    externalDescriptorChildren = externalDescriptorChildren || this._getChildrenFromDescriptor(this.$descriptor);


                    if (this.$defaultContentName && this.$descriptor) {
                        // check if content block is already defined
                        var contentBlock,
                            internAndExternChildren = children.concat(externalDescriptorChildren);


                        for (i = 0; i < internAndExternChildren.length; i++) {
                            child = internAndExternChildren[i];

                            if (child instanceof Content && child.$.name === this.$defaultContentName) {
                                // content block already defined
                                contentBlock = child;
                                break;
                            }
                        }

                        if (!contentBlock) {
                            // create a content block and move all children in a js.core.Content Block
                            contentBlock = this.createComponent(Content, {
                                name: this.$defaultContentName
                            });

                            // add all children to content block
                            for (i = 0; i < externalDescriptorChildren.length; i++) {
                                contentBlock.addChild(externalDescriptorChildren[i]);
                            }

                            externalDescriptorChildren = [contentBlock];
                        }

                    }

                    addChildren(externalDescriptorChildren);

                    var extraChildren = this.createChildren();
                    if (extraChildren) {
                        addChildren(extraChildren);
                    }

                    this._initializeChildren(children);

                    this._childrenInitialized();

                    this._initializeXamlEventAttributes(this.$xamlDefaults, this);
                    this._initializeXamlEventAttributes(this.$xamlAttributes, this.$rootScope);
                },

                createChildren: function () {
                    if(this.$unitializedChildren){
                        var ret = [];
                        while(this.$unitializedChildren.length){
                            ret.push(this.$unitializedChildren.pop());
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
                        console.warn("Descriptor not defined or not correct");
                    }
                },
                _isEventAttribute: function (attributeName) {
                    return attributeName.indexOf("on:") == 0;
                },
                _isXamlEventAttribute: function(attributeName){
                    return attributeName.indexOf("on") == 0;
                },
                _getEventName: function(eventDefinition){
                    return eventDefinition.substr(3);
                },
                /**
                 * Returns true if event is defined in Component event list
                 * @param event
                 */
                _isComponentEvent: function (event) {
                    for (var i = 0; i < this.events.length; i++) {
                        if (event == this.events[i]) {
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
                    var event = '', callback;
                    for (var key in attributes) {
                        if (attributes.hasOwnProperty(key)) {
                            var value = attributes[key];
                            if (this._isXamlEventAttribute(key)) {
                                if (rootScope[value]) {
                                    event = key.substr(2);
                                    callback = rootScope[value];
                                    this.bind("on:"+event, rootScope[value], rootScope);
                                } else {
                                    throw "Couldn't find callback " + value + " for " + key + " event";
                                }
                            }
                        }
                    }
                },
                /***
                 * Initialize all Binding and Event attributes
                 */
                _initializeBindings: function () {
                    if(this.$initialized){
                        return;
                    }
                    var $ = this.$,
                        bindingCreator = this.$bindingCreator,
                        changedAttributes = {},
                        bindingAttributes = {},
                        bindingDefinitions,
                        bindingAttribute,
                        value,
                        key;

                    // we need to find out all attributes which contains binding definitions and set
                    // the corresponding $[key] to null -> than evaluate the bindings
                    // this is because some function bindings belong on other binding values which are
                    // at the time of evaluation maybe unresolved and for example {foo.bar} instead of a value
                    for (key in $) {
                        if ($.hasOwnProperty(key)) {
                            value = $[key];
                            bindingDefinitions = bindingCreator.parse(value);

                            if (bindingCreator.containsBindingDefinition(bindingDefinitions)) {
                                // we found an attribute containing a binding definition
                                bindingAttributes[key] = {
                                    bindingDefinitions: bindingDefinitions,
                                    value: value
                                };

                                $[key] = null;
                            }
                        }
                    }

                    // Resolve bindings and events
                    for (key in $) {
                        if ($.hasOwnProperty(key)) {
                            bindingAttribute = bindingAttributes[key];

                            if (bindingAttribute) {
                                value = bindingAttribute.value;
                                bindingDefinitions = bindingAttribute.bindingDefinitions
                            } else {
                                value = $[key];
                                bindingDefinitions = null;
                            }

                            changedAttributes[key] = bindingCreator.evaluate(value, this, key, bindingDefinitions);
                        }
                    }

                    if(this.$errorAttribute && this.$bindings[this.$errorAttribute]){
                        var b = this.$bindings[this.$errorAttribute][0];
                        if(b.$.twoWay && b.$.path.length > 1){
                            var path = b.$.path.slice(), attrKey = path.pop().name;
                            path = path.concat(bindingCreator.parsePath("errors()."+attrKey));

                            bindingCreator.create({
                                type: 'oneWay',
                                path: path
                            }, this, "_error");
                        }
                    }

                    this.set(changedAttributes);

                    for (var c = 0; c < this.$elements.length; c++) {
                        this.$elements[c]._initializeBindings();
                    }

                    this.callBase();
                },
                /***
                 * Create {@link Component} for DOM Node with given attributes
                 * @param {DOM} node
                 * @param [attributes] for new Component
                 */
                _createComponentForNode: function (node, attributes, rootScope) {
                    if (!node){
                        return null;
                    }

                    attributes = attributes || {};
                    rootScope = rootScope || this.$rootScope;
                    // only instantiation and construction but no initialization

                    if (node.nodeType == 1) { // Elements

                        var fqClassName = this.$stage.$applicationContext.getFqClassName(node.namespaceURI, this._localNameFromDomNode(node), true);
                        var className = this.$stage.$applicationContext.getFqClassName(node.namespaceURI, this._localNameFromDomNode(node), false);


                        return this.$stage.$applicationContext.createInstance(fqClassName, [attributes, node, this.$stage, this, rootScope], className);

                    } else if (node.nodeType == 3 || node.nodeType == 4) { // Text nodes
                        // remove whitespaces from text text nodes
                        var text = node.textContent ? node.textContent : node.text;
                        if (node.textContent) {
                            node.textContent = text;
                        }
                        // only instantiation and construction but no initialization
                        return this._createTextElement(node, rootScope);
                    }

                    return null;
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

                    return this.$stage.$applicationContext.createInstance(factory, [attributes, descriptor, this.$stage, this, this.$rootScope]);
                },

                createBinding: function (path, callback, callbackScope) {
                    callbackScope = callbackScope || this;
                    this.$bindingCreator.evaluate(path, this, function () {
                        callback.apply(callbackScope, arguments);
                    });
                },

                _createTextElement: function (node, rootScope) {
                    return this.$stage.$applicationContext.createInstance('js/core/TextElement', [null, node, this.$stage, this, rootScope]);
                },

                /***
                 * Converts all child nodes of a descriptor to instances of Components or TextElement
                 * @param descriptor
                 */
                _getChildrenFromDescriptor: function (descriptor, rootScope) {
                    var childrenFromDescriptor = [], node, component;

                    if (descriptor && descriptor.childNodes) {
                        for (var i = 0; i < descriptor.childNodes.length; i++) {
                            node = descriptor.childNodes[i];
                            component = this._createComponentForNode(node, null, rootScope);
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
                 * IE8 FIXES
                 * @param domNode
                 */
                _localNameFromDomNode: function (domNode) {
                    if (domNode.localName) {
                        return domNode.localName;
                    }

                    var st = domNode.tagName.split(":");
                    return st[st.length - 1];
                }
            });

        var Template = Component.Template = Component.inherit("js.core.Template", {

            _initializeDescriptors: function () {
                this._cleanUpDescriptor(this.$descriptor);
                this._childrenInitialized();
            },

            createComponents: function (attributes, parentScope, rootScope) {
                rootScope = rootScope || this.$rootScope;
                parentScope = parentScope || this.$parentScope;
                // foreach child Descriptor
                var components = this._getChildrenFromDescriptor(this.$descriptor, null, rootScope);

                for (var c = 0; c < components.length; c++) {
                    components[c].$parentScope = parentScope;
                    components[c].set(attributes);
                }

                return components;
            },

            createInstance: function (attributes, parentScope, rootScope) {
                var components = this.createComponents(attributes, parentScope, rootScope);
                return components[0];
            }
        });

        Component.Configuration = Component.inherit("js.core.Configuration", {

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

        var Content = Component.Content = Component.inherit("js.core.Content", {
            getChildren: function () {
                var el, children = [];
                for (var i = 0; i < this.$elements.length; i++) {
                    el = this.$elements[i];
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