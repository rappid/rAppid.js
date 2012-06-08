define(["require", "js/core/Element", "js/core/TextElement", "js/core/Bindable", "js/core/EventDispatcher", "underscore"],

    function (require, Element, TextElement, Bindable, EventDispatcher, _) {

        var Template,
            Configuration;


        var Component = Element.inherit("js.core.Component",
            /** @lends Component */
            {
                /***
                 * What up??
                 * @param attributes The attributes of the component
                 * @param {String} attributes.style The style of the component
                 * @param {Node} descriptor
                 * @param {SystemManager} systemManager
                 * @param {Element} parentScope
                 * @param {Element} rootScope
                 * @constructs
                 */
                ctor: function (attributes, descriptor, systemManager, parentScope, rootScope) {
                    if (_.isUndefined(Template)) {
                        try {
                            Template = require('js/core/Template');
                        } catch(e) {
                            Template = null;
                        }
                    }

                    if (_.isUndefined(Configuration)) {
                        try {
                            Configuration = require('js/conf/Configuration');
                        } catch(e) {
                            Configuration = null;
                        }
                    }
                    this.$eventDefinitions = [];
                    this.$internalDescriptors = [];
                    this.$xamlDefaults = {};
                    this.$xamlAttributes = {};
                    var current = this, last;
                    while (current) {
                        if (current._$descriptor && last != current) {
                            this._cleanUpDescriptor(current._$descriptor);
                            this.$internalDescriptors.unshift(current._$descriptor);

                            _.extend(this.$xamlDefaults, this._getAttributesFromDescriptor(current._$descriptor));
                        }
                        current = current.base;
                    }

                    if (descriptor) {
                        this._cleanUpDescriptor(descriptor);
                        this.$xamlAttributes = this._getAttributesFromDescriptor(descriptor);
                    }

                    this.$components = [];

                    this.$templates = {};
                    this.$configurations = [];
                    this.$children = [];

                    attributes = attributes || {};
                    _.extend(attributes, this.$xamlAttributes, this.$xamlDefaults);

                    this.callBase();
                },

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
                },
                _inject: function () {

                    var inject = this._injectChain();

                    if (_.keys(inject).length > 0) {
                        // we need to inject at least on item

                        // synchronous singleton instantiation of Injection,
                        // because if module requires injection, application also depends on
                        // Injection.js and class should be installed.
                        var injection = this.$systemManager.$injection;
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
                addComponent: function (component) {
                    if (!component) {
                        throw "component null";
                    }

                    this.$components.push(component);

                    if (this.$rootScope && component.$.cid) {
                        // register component by cid in the root scope
                        this.$rootScope.set(component.$.cid, component);
                    }
                },

                removeComponent: function (component) {
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

                removeChild: function (child) {
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

                addTemplate: function (template) {
                    if (!template.$.name) {
                        throw "template without name";
                    }

                    this.addComponent(template);
                    this.$templates[template.$.name] = template;
                },

                addConfiguration: function (config) {
                    this.addComponent(config);
                    this.$configurations.push(config);
                },

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
                        // FIRST ADD CHILD
                        var child = childComponents[i];

                        if (Template && child instanceof Template) {
                            this.addTemplate(child);
                        } else if (Configuration && child instanceof Configuration) {
                            this.addConfiguration(child);
                        } else {
                            this.addChild(childComponents[i]);
                        }

                        // THEN INITIALIZE !
                        if (this.$creationPolicy == "auto") {
                            child._initialize(this.$creationPolicy);
                        }
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
                    var children = [];

                    var desc;
                    for (var d = 0; d < this.$internalDescriptors.length; d++) {
                        desc = this.$internalDescriptors[d];
                        children = children.concat(this._getChildrenFromDescriptor(desc, this));
                    }

                    children = children.concat(this._getChildrenFromDescriptor(this.$descriptor));

                    this._initializeChildren(children);

                    this._childrenInitialized();

                    this._initializeEventAttributes(this.$xamlDefaults, this);
                    this._initializeEventAttributes(this.$xamlAttributes, this.$rootScope);
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
                /**
                 * an array of attributes names, which will expect handler functions
                 */
                _isEventAttribute: function (attributeName) {
                    return attributeName.indexOf("on") == 0;
                    // return this._eventAttributes.hasOwnProperty(attributeName);
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
                _initializeEventAttributes: function (attributes, rootScope) {
                    var event = '';
                    for (var key in attributes) {
                        if (attributes.hasOwnProperty(key)) {
                            var value = attributes[key];

                            if (this._isEventAttribute(key)) {
                                if (rootScope[value]) {

                                    this.$eventDefinitions.push({
                                        name: key,
                                        scope: rootScope,
                                        fncName: value
                                    });
                                    event = key.substr(2);
                                    if (this._isComponentEvent(event)) {
                                        this.bind(event, rootScope[value], rootScope);
                                    }

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
                    var attributes = this.$;

                    var value;
                    // Resolve bindings and events
                    for (var key in attributes) {

                        if (attributes.hasOwnProperty(key)) {
                            value = attributes[key];
                            this.$[key] = this.$bindingCreator.evaluate(value, this, key);
                        }
                    }

                    for (var c = 0; c < this.$components.length; c++) {
                        this.$components[c]._initializeBindings();
                    }

                    this.callBase();
                },
                /***
                 * Create {@link Component} for DOM Node with given attributes
                 * @param DOM Node
                 * @param attributes for new Component
                 */
                _createComponentForNode: function (node, attributes, rootScope) {
                    if (!node) return null;

                    attributes = attributes || {};
                    rootScope = rootScope || this.$rootScope;
                    // only instantiation and construction but no initialization
                    var appDomain = this.$systemManager.$applicationDomain;

                    if (node.nodeType == 1) { // Elements

                        var fqClassName = this.$systemManager.$applicationContext.getFqClassName(node.namespaceURI, this._localNameFromDomNode(node), true);
                        var className = this.$systemManager.$applicationContext.getFqClassName(node.namespaceURI, this._localNameFromDomNode(node), false);

                        return this.$systemManager.$applicationContext.createInstance(fqClassName, [attributes, node, this.$systemManager, this, rootScope], className);

                    } else if (node.nodeType == 3 || node.nodeType == 4) { // Textnodes
                        // remove whitespaces from text textnodes
                        var text = node.textContent ? node.textContent : node.text;
                        if (node.textContent) {
                            node.textContent = text;
                        }
                        // only instantiation and construction but no initialization
                        return this._createTextElement(node, rootScope);
                    }

                    return null;
                },

                _createTextElement: function(node, rootScope) {
                    return this.$systemManager.$applicationContext.createInstance('js/core/TextElement', [null, node, this.$systemManager, this, rootScope]);
                },

                /***
                 * Converts all child nodes of a descriptor to instances of Components or TextElement
                 * @param descriptor
                 */
                _getChildrenFromDescriptor: function (descriptor, rootScope) {
                    var childrenFromDescriptor = [], node, component;

                    if (descriptor) {
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
                    if (domNode.localName) return domNode.localName;

                    var st = domNode.tagName.split(":");
                    return st[st.length - 1];
                }
            });

        return Component;
    }
);