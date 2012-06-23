define(["require", "js/core/EventDispatcher","js/core/Component", "js/core/Content", "js/core/Binding", "inherit", "underscore"],
    function (require, EventDispatcher, Component, Content, Binding, inherit, _) {

        var rspace = /\s+/;

        var ContentPlaceHolder;

        var DomElementFunctions = {

            $classAttributes: [
                /^\$/,
                /^data/,
                /^xmlns/,
                /^on/,
                "cid",
                /^_/ // private attributes
            ],

            ctor: function (attributes, descriptor, systemManager, parentScope, rootScope) {
                this.$renderMap = {};
                this.$children = [];
                this.$contentChildren = [];
                this.$domEventHandler = {};
                // go inherit tree up and search for descriptors
                var current = this;
                while (current) {
                    if (current.$classAttributes) {
                        this.$classAttributes = this.$classAttributes.concat(current.$classAttributes);
                    }
                    current = current.base;
                }


                this.callBase();

                if (descriptor) {
                    if (!this.$tagName) {
                        this.$tagName = descriptor.tagName;
                    }
                    if (!this.$namespace) {
                        this.$namespace = descriptor.namespaceURI;
                    }
                }
            },

            _inject: function () {
                this.callBase();

                var inject = this._injectChain();

                for (var name in inject) {
                    if (inject.hasOwnProperty(name)) {
                        this.$classAttributes.push(name);
                    }
                }

            },

            _initializeAttributes: function (attributes) {
                this.callBase();

                if (attributes.tagName) {
                    this.$tagName = attributes.tagName;
                    delete(attributes.tagName);
                }

                if (attributes.namespace) {
                    this.$namespace = attributes.namespace;
                    delete (attributes.namespace);
                }
            },

            addChild: function (child) {
                this.callBase();

                if (child instanceof DomElement || child.render) {
                    this.$children.push(child);
                    if (this.isRendered()) {
                        this._renderChild(child);
                    }
                } else if (child instanceof Content) {
                    this.$contentChildren.push(child);
                }
            },

            removeChild: function (child) {
                this.callBase();
                if (child instanceof DomElement || child.render) {
                    if (this.isRendered()) {
                        this._removeRenderedChild(child);
                    }
                    var i = this.$children.indexOf(child);
                    this.$children.splice(i, 1);
                }
            },

            getPlaceHolder: function (name) {
                for (var i = 0; i < this.$children.length; i++) {
                    if (this.$children[i].$.name === name) {
                        return this.$children[i];
                    }
                }
                var placeholder;
                for (i = 0; i < this.$children.length; i++) {
                    if (this.$children[i].getPlaceHolder) {
                        placeholder = this.$children[i].getPlaceHolder(name);
                        if (placeholder) {
                            return placeholder;
                        }
                    }

                }
                return null;
            },

            remove: function () {
                if (this.$parent) {
                    this.$parent.removeChild(this);
                }
            },

            getContentPlaceHolders: function () {

                if (!ContentPlaceHolder) {
                    ContentPlaceHolder = require('js/ui/ContentPlaceHolder');
                }

                var ret = [];

                var child;
                for (var i = 0; i < this.$children.length; i++) {
                    child = this.$children[i];

                    if (ContentPlaceHolder && child instanceof ContentPlaceHolder) {
                        ret.push(child);
                    } else if (child instanceof DomElement) {
                        ret = ret.concat(child.getContentPlaceHolders());
                    }
                }

                return ret;

            },

            findContent: function (name) {

                var child,
                    content;

                for (var i = 0; i < this.$elements.length; i++) {
                    child = this.$elements[i];
                    if (child instanceof Content && child.$.name === name) {
                        return child;
                    }
                }

                for (i = 0; i < this.$elements.length; i++) {
                    child = this.$elements[i];
                    if (child.findContent) {
                        content = child.findContent(name);
                        if (content) {
                            return content;
                        }
                    }

                }

                return null;
            },

            render: function () {

                if (!this.$initialized) {
                    this._initialize(this.$creationPolicy);
                }
                // check if it is already rendered
                if (this.isRendered()) {
                    return this.$el;
                }

                this.$renderedChildren = [];

                if (this.$stage.$document.createElementNS && this.$namespace && /^http/.test(this.$namespace)) {
                    this.$el = this.$stage.$document.createElementNS(this.$namespace, this.$tagName);
                } else {
                    this.$el = this.$stage.$document.createElement(this.$tagName);
                }

                this._initializeRenderer(this.$el);
                this._renderChildren(this.$children);
                this._renderContentChildren(this.$contentChildren);
                this._renderAttributes(this.$);
                this._bindDomEvents(this.$el);

                return this.$el;
            },
            _bindDomEvents: function (el) {
                var eventDef, es;

                for (var i = 0; i < this.$eventDefinitions.length; i++) {
                    eventDef = this.$eventDefinitions[i];
                    es = eventDef.name.substr(2);
                    this.bind(es, eventDef.scope[eventDef.fncName], eventDef.scope);
                }
            },

            _initializeRenderer: function (el) {
                // hook
            },

            _renderChildren: function (children) {
                // for all children
                var child;
                for (var i = 0; i < children.length; i++) {
                    child = children[i];
                    this._renderChild(child);
                }
            },

            _renderContentChildren: function (children) {
                var child;
                for (var i = 0; i < children.length; i++) {
                    child = children[i];
                    var ref = child.get('ref');
                    var placeHolder = this.getPlaceHolder(ref);
                    if (placeHolder) {
                        placeHolder.set({content: child});
                    }
                }
            },

            _renderChild: function (child) {
                if (_.isFunction(child.render)) {
                    var el = child.render();
                    this.$renderedChildren.push(child);
                    if (el) {
                        this.$el.appendChild(el);
                    }
                }
            },

            _removeRenderedChild: function (child) {
                if (this.isRendered()) {
                    var rc;
                    for (var i = this.$renderedChildren.length - 1; i >= 0; i--) {
                        rc = this.$renderedChildren[i];
                        if (child === rc) {
                            this.$el.removeChild(rc.$el);
                            this.$renderedChildren.splice(i, 1);
                            return;
                        }
                    }
                }
            },

            _clearRenderedChildren: function () {
                if (this.isRendered()) {
                    var rc;
                    for (var i = this.$renderedChildren.length - 1; i >= 0; i--) {
                        rc = this.$renderedChildren[i];
                        this.$el.removeChild(rc.$el);
                    }
                }
                this.$renderedChildren = [];
            },

            _getIndexOfPlaceHolder: function (placeHolder) {
                if (this.$layoutTpl) {
                    var child;
                    for (var i = 0; i < this.$layoutTpl.$children.length; i++) {
                        child = this.$layoutTpl.$children[i];
                        if (placeHolderId == child.$cid) {
                            return i;
                        }
                    }
                }
                return -1;
            },

            isRendered: function () {
                return typeof (this.$el) !== "undefined";
            },

            _renderAttributes: function (attributes) {
                var attr;
                for (var key in attributes) {
                    if (attributes.hasOwnProperty(key)) {
                        attr = attributes[key];
                        this._renderAttribute(key, attr);
                    }
                }
            },

            _renderAttribute: function (key, attr) {
                var method = this.$renderMap[key];
                var prev = this.$previousAttributes[key];

                if (_.isUndefined(method)) {
                    // generic call of render functions

                    var k = key.charAt(0).toUpperCase() + key.substr(1);
                    var methodName = "_render" + k;
                    method = this[methodName];

                    if (!_.isFunction(method)) {
                        method = false;
                    }

                    this.$renderMap[key] = method;
                }
                if (method !== false) {
                    method.call(this, attr, prev);
                } else {
                    var cAttr;
                    for (var i = 0; i < this.$classAttributes.length; i++) {
                        cAttr = this.$classAttributes[i];
                        if (cAttr instanceof RegExp) {
                            if (cAttr.test(key)) {
                                return;
                            }
                        } else {
                            if (cAttr == key) {
                                return;
                            }
                        }
                    }
                    this._setAttribute(key, attr);
                }
            },
            _setAttribute: function (key, value, namespaceUri) {

                if (!_.isUndefined(value)) {

                    namespaceUri = namespaceUri || this.$attributesNamespace[key];

                    if (this.$el.setAttributeNS && namespaceUri) {
                        this.$el.setAttributeNS(namespaceUri, key, value)
                    } else {
                        this.$el.setAttribute(key, value);
                    }
                }
            },


            _commitChangedAttributes: function (attributes) {
                if (this.isRendered()) {
                    this._renderAttributes(attributes);
                }
            },
            destroy: function () {
                this.callBase();

                if (this.$children) {
                    for (var i = 0; i < this.$children.length; i++) {
                        this.$children[i].destroy();
                    }
                }
            },
            html: function () {
                if (!this.isRendered()) {
                    this.render();
                }
                return this.$el.innerHTML;

            }.on('change'),
            dom: function (element) {
                return new DomManipulation(element || this);
            },
            setChildIndex: function (child, index) {
                if(index < 0){
                    index += this.$children.length;
                }
                if(index >= this.$children.length ){
                    index -= this.$children.length;
                }
                var oldIndex = this.$children.indexOf(child);
                if (oldIndex !== index) {
                    this.$children.splice(oldIndex, 1);
                    this.$children.splice(index, 0, child);
                    if (this.isRendered() && child.isRendered()) {
                        if (this.$renderedChildren.length > 1) {
                            this.$el.removeChild(child.$el);
                            if (index < this.$el.childNodes.length) {
                                this.$el.insertBefore(child.$el, this.$el.childNodes[index]);
                            } else {
                                this.$el.appendChild(child.$el);
                            }
                        }
                    }
                }
            },
            bringToFront: function () {
                if (this.$parent) {
                    this.$parent.setChildIndex(this, this.$parent.$children.length - 1);
                }
            },
            sendToBack: function () {
                if (this.$parent) {
                    this.$parent.setChildIndex(this, 0);
                }
            },
            bind: function (type, eventHandler, scope) {
                var self = this;
                this.callBase();
                if (this.isRendered() && !this.$domEventHandler[type] && !this._isComponentEvent(type))  {
                    var cb = this.$domEventHandler[type] = function (originalEvent) {
                        var e = new DomElement.Event(originalEvent);
                        try {
                            self.trigger(type, e, self);
                        } catch(e) {}
                        if (e.isPropagationStopped) {
                            return false;
                        }
                    };
                    this.bindDomEvent(type,cb);
                }
            },

            unbind: function (type, handle, scope) {
                this.callBase();
                var handlers = this._eventHandlers[type];
                if (handlers && handlers.length === 0) {
                    var cb = this.$domEventHandler[type];
                    if(cb){
                        this.unbindDomEvent(type,cb);
                    }
                }
            }
        };

        var DomManipulationFunctions = {
            hasClass: function (value) {
                return this.$el.className.split(" " + value + " ").length != 1;
            },
            addClass: function (value) {
                var classNames = value.split(rspace);

                if (!this.$el.className && classNames.length === 1) {
                    this.$el.className = value;
                } else {
                    var setClasses = this.$el.className.split(rspace);

                    for (var i = 0; i < classNames.length; i++) {
                        if (setClasses.indexOf(classNames[i]) == -1) {
                            setClasses.push(classNames[i]);
                        }
                    }

                    this.$el.className = setClasses.join(" ");

                }
            },

            removeClass: function (value) {

                if (!(this.$el.className && this.$el.className.length !== 0)) {
                    return;
                }
                var removeClasses = value.split(rspace);

                var classes = this.$el.className.split(rspace);

                for (var i = 0; i < removeClasses.length; i++) {
                    var index = classes.indexOf(removeClasses[i]);
                    if (index != -1) {
                        classes.splice(index, 1);
                    }
                }

                if (classes.length === 0) {
                    this.$el.removeAttribute('class');
                } else {
                    this.$el.className = classes.join(" ");
                }
            },
            bindDomEvent: function (type, cb) {
                if (this.$el.addEventListener) {
                    this.$el.addEventListener(type, cb, false);

                } else if (this.$el.attachEvent) {
                    this.$el.attachEvent("on" + type, cb);
                }
            },
            unbindDomEvent: function (type, cb) {
                if (this.$el.removeEventListener) {
                    this.$el.removeEventListener(type, cb, false);
                } else if (this.$el.detachEvent) {
                    this.$el.detachEvent("on" + type, cb);
                }
            }
        };

        var DomManipulation = inherit.Base.inherit(_.extend({
            ctor: function (elm) {
                this.$el = elm;
            }
        }, DomManipulationFunctions));

        var DomElement = Component.inherit("js.html.DomElement",
            _.extend(DomElementFunctions, DomManipulationFunctions));

        DomElement.Event = EventDispatcher.Event.inherit({
            ctor: function (domEvent) {
                this.domEvent = domEvent;
                this.callBase(domEvent);
            },
            stopPropagation: function () {
                this.callBase();

                var e = this.domEvent;
                if (e) {
                    if (e.stopPropagation) {
                        e.stopPropagation();
                    }
                    e.cancelBubble = true;
                }
            },
            preventDefault: function () {
                this.callBase();
                var e = this.domEvent;
                if (e) {
                    if (e.preventDefault) {
                        e.preventDefault();
                    } else {
                        e.returnValue = false;  // IE
                    }
                }
            }
        });

        return DomElement;
    }
);