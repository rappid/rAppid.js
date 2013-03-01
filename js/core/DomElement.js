define(["require", "js/core/EventDispatcher", "js/core/Component", "js/core/Content", "js/core/Binding", "inherit", "underscore", 'js/core/Base'],
    function (require, EventDispatcher, Component, Content, Binding, inherit, _, Base) {

        var rspace = /\s+/;
        var undefined;
        var ContentPlaceHolder;

        var pointerToTouchMap = {
            'on:pointer' : 'on:touchstart',
            'on:pointerdown': 'on:touchstart',
            'on:pointermove': 'on:touchmove',
            'on:pointerup': 'on:touchend'
        };

        var pointerToMouseMap = {
            'on:pointer': 'on:click',
            'on:pointerdown': 'on:mousedown',
            'on:pointermove': 'on:mousemove',
            'on:pointerup': 'on:mouseup',
            'on:pointerout': 'on:mouseout',
            'on:pointerover': 'on:mouseover',
            'on:pointerhover': 'on:mouseover'

        };

        var pointerToMSPointerMap = {
            'on:pointerdown': 'on:mspointerdown',
            'on:pointermove': 'on:mspointermove',
            'on:pointerup': 'on:mspointerup',
            'on:pointerout' : 'on:mspointerout',
            'on:pointerover' : 'on:mspointerover',
            'on:pointerhover' : 'on:mspointerhover'
        };

        var DomElementFunctions = {

            $classAttributes: [
                /^\$/,
                /^xmlns/,
                /^on/,
                "cid",
                /^_/ // private attributes
            ],
            defaults: {
                visible: true
            },
            ctor: function (attributes, descriptor, systemManager, parentScope, rootScope) {
                this.$addedToDom = false;
                this.$renderMap = {};
                this.$children = [];
                this.$invisibleChildMap = {};
                this.$renderedChildren = [];
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
                        this.$tagName = this._getLocalNameFromNode(descriptor);
                    }
                    if (!this.$namespace) {
                        this.$namespace = descriptor.namespaceURI;
                    }
                }

                this.bind('add:dom', this._onDomAdded, this);
            },

            /**
             * This method is called when the stage or the parent is added to the DOM
             * @private
             */
            _onDomAdded: function () {
                this.$addedToDom = true;
                for (var i = 0; i < this.$renderedChildren.length; i++) {
                    this.$renderedChildren[i].trigger('add:dom', this.$el);
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

            addChild: function (child, options) {
                this.callBase();

                if (child.$initialized || child.$initializing) {
                    if (child instanceof DomElement || child.render) {
                        var pos = options && typeof(options.childIndex) !== "undefined" ? options.childIndex : this.$children.length;

                        this.$children[pos] = child;
                        if (this.isRendered()) {
                            this._renderChild(child, pos);
                        }
                    } else if (child instanceof Content) {
                        this.$contentChildren.push(child);
                    }

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

                for (var i = 0; i < this.$contentChildren.length; i++) {
                    child = this.$contentChildren[i];
                    if (child instanceof Content && child.$.name === name) {
                        return child;
                    }
                }

                for (i = 0; i < this.$contentChildren.length; i++) {
                    child = this.$contentChildren[i];
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

                this.$el = this._createDomElement(this.$tagName, this.$namespace);

                this._initializeRenderer(this.$el);
                this._renderChildren(this.$children);
                this._renderContentChildren(this.$contentChildren);
                this._renderAttributes(this.$);
                this._bindDomEvents(this.$el);

                return this.$el;
            },

            _createDomElement: function (tagName, namespace) {
                if (this.$stage.$document.createElementNS && namespace && /^http/.test(namespace)) {
                    return this.$stage.$document.createElementNS(namespace, tagName);
                } else {
                    return this.$stage.$document.createElement(tagName);
                }
            },

            _bindDomEvents: function (el) {
                var eventDef, fnc;

                for (var i = 0; i < this.$eventDefinitions.length; i++) {
                    eventDef = this.$eventDefinitions[i];
                    this.bind(eventDef.type, eventDef.eventHandler, eventDef.scope);
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
                    var ref = child.get('name');
                    var placeHolder = this.getPlaceHolder(ref);
                    if (placeHolder) {
                        placeHolder.set({content: child});
                    }
                }
            },

            _renderChild: function (child, pos) {
                if (_.isFunction(child.render)) {
                    child.$renderParent = this;
                    var el = child.render();
                    this.$renderedChildren.push(child);
                    if (el && child.$.visible) {
                        if (pos == undefined) {
                            this.$el.appendChild(el);
                        } else {
                            var childNode = this.$el.childNodes[pos];
                            if (childNode) {
                                this.$el.insertBefore(el, childNode)
                            } else {
                                this.$el.appendChild(el);
                            }
                        }
                        if (this.$addedToDom) {
                            child.trigger('add:dom', this.$el);
                        }
                    } else {
                        this.$invisibleChildMap[child.$cid] = child;
                    }
                }
            },
            _renderVisible: function (visible) {
                if (this.$renderParent) {
                    if (visible) {
                        this.$renderParent.setChildVisible(this);
                    } else {
                        this.$renderParent.setChildInvisible(this);
                    }
                }
            },
            _renderComponentClass: function (cls, oldCls) {
                if (oldCls) {
                    this.removeClass(oldCls);
                }
                if (cls) {
                    this.addClass(cls);
                }
            },

            _renderClass: function (className, oldClass) {
                if (oldClass) {
                    this.removeClass(oldClass);
                }
                if (className) {
                    this.addClass(className);
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
                        if (rc.$.visible) {
                            this.$el.removeChild(rc.$el);
                        }
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
                    this._renderAttributeInternal(key, attr);
                }
            },

            _renderAttributeInternal: function (key, attr) {
                if (this._isDOMNodeAttribute(key)) {
                    this._setAttribute(key, attr);
                }
            },

            /***
             * Returns wether a attribute key is a dom attribute or not
             * Therefor it looks in the $classAttributes array.
             * @param {String} key
             * @return {Boolean}
             * @private
             */
            _isDOMNodeAttribute: function (key) {
                var cAttr;
                for (var i = 0; i < this.$classAttributes.length; i++) {
                    cAttr = this.$classAttributes[i];
                    if (cAttr instanceof RegExp) {
                        if (cAttr.test(key)) {
                            return false;
                        }
                    } else {
                        if (cAttr == key) {
                            return false;
                        }
                    }
                }

                return true;
            },

            /***
             * sets the attribute as part of the rendering cycle on the element
             *
             * @param {String} key - name of the attribute
             * @param {String} value - value of the attribute
             * @param {String} [namespaceUri] - namespaceUri for the attribute
             * @private
             */
            _setAttribute: function (key, value, namespaceUri) {

                if (!_.isUndefined(value) && value !== null) {
                    namespaceUri = namespaceUri || this.$attributesNamespace[key];

                    if (this.$el.setAttributeNS && namespaceUri) {
                        this.$el.setAttributeNS(namespaceUri, key, value)
                    } else {
                        this.$el.setAttribute(key, value);
                    }
                } else {
                    // first set empty -> needed for Chrome
                    this.$el.setAttribute(key, "");
                    // then remove -> needed for firefox
                    this.$el.removeAttribute(key);
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
                if (index < 0) {
                    index += this.$children.length;
                }
                if (index >= this.$children.length) {
                    index -= this.$children.length;
                }
                var oldIndex = this.$children.indexOf(child);
                if (oldIndex !== index) {
                    this.$children.splice(oldIndex, 1);
                    this.$children.splice(index, 0, child);
                    if (this.isRendered() && child.isRendered()) {
                        if (this.$renderedChildren.length > 1) {
                            this.$el.removeChild(child.$el);
                            var next = this._getNextVisibleChild(child);
                            if (next) {
                                this.$el.insertBefore(child.$el, next.$el);
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
            setChildInvisible: function (child) {
                if (this.isRendered() && this.$renderedChildren.indexOf(child) > -1) {
                    if (child.$el.parentNode) {
                        this.$el.removeChild(child.$el);
                    }
                    this.$invisibleChildMap[child.$cid] = child;
                }
            },
            setChildVisible: function (child) {
                if (this.isRendered() && this.$invisibleChildMap[child.$cid]) {
                    var next = this._getNextVisibleChild(child);
                    if (next) {
                        this.$el.insertBefore(child.$el, next.$el);
                    } else {
                        this.$el.appendChild(child.$el);
                    }
                    if (this.$addedToDom) {
                        child.trigger('add:dom', this.$el);
                    }
                    delete this.$invisibleChildMap[child.$cid];
                }
            },
            _getNextVisibleChild: function (child) {
                if (this.$el.childNodes.length === 0) {
                    return null;
                }
                var index = this.$renderedChildren.indexOf(child);
                for (var i = index + 1; i < this.$renderedChildren.length; i++) {
                    if (!this.$invisibleChildMap[this.$renderedChildren[i].$cid]) {
                        break;
                    }
                }
                if (i < this.$renderedChildren.length && child !== this.$renderedChildren[i]) {
                    return this.$renderedChildren[i];
                }
                return null;
            },
            _createDOMEventHandler: function (type) {
                if(type.indexOf("on:pointer") === 0){
                    return new DomElement.PointerEventHandler(this, type);
                }
                return new DomElement.EventHandler(this, type);
            },
            bind: function (type, eventHandler, scope) {
                if (type.indexOf("on:") === 0 && !this.$domEventHandler[type] && !this._isComponentEvent(type)) {
                    if (this.isRendered()) {
                        var cb = this.$domEventHandler[type] = this._createDOMEventHandler(type);
                        this.bindDomEvent(this._mapDOMEventType(type).substr(3), cb);
                        this.callBase();
                    } else {
                        this.$eventDefinitions.push({
                            scope: scope || this,
                            type: type,
                            eventHandler: eventHandler
                        });
                    }
                } else {
                    this.callBase();
                }
            },

            unbind: function (type, handle, scope) {
                this.callBase();
                var handlers = this._eventHandlers[type];
                if (handlers && handlers.length === 0) {
                    var cb = this.$domEventHandler[type];

                    if (cb) {
                        this.unbindDomEvent(this._mapDOMEventType(type), cb);
                    }
                }
            },
            _mapDOMEventType: function(type){
                if(type.indexOf("on:pointer") === 0){
                    if(this.$stage.$browser.msPointerEnabled){
                        return pointerToMSPointerMap[type] || type;
                    } else if (this.$stage.$browser.hasTouch) {
                        return pointerToTouchMap[type] || type;
                    } else {
                        return pointerToMouseMap[type] || type;
                    }
                }
                return type;
            }
        };

        var DomManipulationFunctions = {
            hasClass: function (value) {
                return (this.$el.getAttribute("class") || "").split(" " + value + " ").length != 1;
            },

            addClass: function (value) {
                var classNames = ("" + value).split(rspace);

                var className = this.$el.getAttribute("class") || "";

                if (!className && classNames.length === 1) {
                    this.$el.setAttribute("class", value);
                } else {
                    var setClasses = className.split(rspace);

                    for (var i = 0; i < classNames.length; i++) {
                        if (setClasses.indexOf(classNames[i]) == -1) {
                            setClasses.push(classNames[i]);
                        }
                    }

                    this.$el.setAttribute("class", setClasses.join(" "));
                }
            },

            removeClass: function (value) {

                var className = this.$el.getAttribute("class") || "";

                if (!(className && className.length)) {
                    return;
                }

                var removeClasses = value.split(rspace);

                var classes = className.split(rspace);

                for (var i = 0; i < removeClasses.length; i++) {
                    var index = classes.indexOf(removeClasses[i]);
                    if (index != -1) {
                        classes.splice(index, 1);
                    }
                }

                if (classes.length === 0) {
                    this.$el.removeAttribute('class');
                } else {
                    this.$el.setAttribute("class", classes.join(" "));
                }
            },

            bindDomEvent: function (type, cb) {
                if (this.$el.addEventListener) {
                    this.$el.addEventListener(type, cb, false);

                } else if (this.$el.attachEvent) {
                    var callback = cb;
                    if (cb instanceof DomElement.EventHandler) {
                        callback = cb._handleEvent = function (e) {
                            return cb.handleEvent(e);
                        }
                    }
                    this.$el.attachEvent("on" + type, callback);
                }
            },
            unbindDomEvent: function (type, cb) {
                if (this.$el.removeEventListener) {
                    this.$el.removeEventListener(type, cb, false);
                } else if (this.$el.detachEvent) {
                    var callback = cb;
                    if (cb instanceof DomElement.EventHandler) {
                        callback = cb._handleEvent;
                    }

                    this.$el.detachEvent("on" + type, callback);
                }
            },

            focus: function () {
                if (this.isRendered()) {
                    this.$el.focus();
                }
            },

            localToGlobal: function (point) {
                point = point || {
                    x: 0,
                    y: 0
                };

                var html = this._getHtmlTag();
                if (!html) {
                    throw new Error("Html tag not found");
                }

                var htmlRect = html.getBoundingClientRect(),
                    elementRect = this.$el.getBoundingClientRect();

                return {
                    x: -htmlRect.top + elementRect.top + html.offsetTop + point.x,
                    y: -htmlRect.left + elementRect.left + html.offsetLeft + point.y
                };

            },

            globalToLocal: function (point) {
                point = point || {
                    x: 0,
                    y: 0
                };

                var html = this._getHtmlTag();
                if (!html) {
                    throw new Error("Html tag not found");
                }

                var htmlRect = html.getBoundingClientRect(),
                    elementRect = this.$el.getBoundingClientRect();

                return {
                    x: point.x + htmlRect.left - html.offsetLeft - elementRect.left,
                    y: point.y + htmlRect.top - html.offsetTop - elementRect.top
                };
            },

            _getHtmlTag: function () {
                var document = this.$stage.$document;

                if (!this.$stage.$html) {
                    this.$stage.$html = document.getElementsByTagName("html")[0];
                }

                return this.$stage.$html;
            }
        };

        var DomManipulation = inherit.Base.inherit(_.extend({
            ctor: function (elm) {
                this.$el = elm;
            }
        }, DomManipulationFunctions));

        var DomElement = Component.inherit("js.html.DomElement",
            _.extend(DomElementFunctions, DomManipulationFunctions));

        DomElement.Event = EventDispatcher.Event.inherit('js.core.DomElement.Event', {
            ctor: function (domEvent) {
                this.domEvent = domEvent;
                this.callBase(domEvent);

                this.isDefaultPrevented = !!domEvent.defaultPrevented;
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

        DomElement.PointerEvent = DomElement.Event.inherit('js.core.DomElement.PointerEvent', {
            ctor: function (domEvent) {
                if (domEvent.changedTouches || domEvent.touches) {
                    this.isTouch = true;
                    this.pointerEvent = domEvent.touches.length ? domEvent.touches[0] : domEvent.changedTouches[0];
                } else {
                    this.pointerEvent = domEvent;
                }
                this.callBase(domEvent);
            }

        });


        DomElement.EventHandler = Base.inherit('js.core.DomEvent.EventHandler', {
            ctor: function (component, type) {
                this.component = component;
                this.type = type;
            },
            handleEvent: function (e) {
                if (this._isEventEnabled()) {
                    e = this._createEvent(e);
                    this.component.trigger(this.type, e, this.component);
                    return !e.isPropagationStopped;
                } else {
                    e.preventDefault();
                    return false;
                }
            },
            _isEventEnabled: function () {
                if (!this.component.$.enabled) {
                    if (_.include(['on:click', 'on:dblclick', 'on:pointer'], this.type)) {
                        return false;
                    }
                }
                return true;
            },
            _createEvent: function (domEvent) {
                return new DomElement.Event(domEvent);
            }
        });

        DomElement.PointerEventHandler = DomElement.EventHandler.inherit('js.core.DomEvent.PointerEventHandler', {
            _createEvent: function(domEvent){
                return new DomElement.PointerEvent(domEvent);
            }
        });

        return DomElement;
    }
);