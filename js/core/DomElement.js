define(["require", "js/core/EventDispatcher", "js/core/Component", "js/core/Content", "inherit", "underscore", 'js/core/Base'],
    function (require, EventDispatcher, Component, Content, inherit, _, Base) {

        var rspace = /\s+/;
        var undefined;
        var ContentPlaceHolder;

        var pointerToTouchMap = {
            'pointer': 'click',
            'pointerdown': 'touchstart',
            'pointermove': 'touchmove',
            'pointerup': 'touchend'
        };

        var pointerToMouseMap = {
            'pointer': 'click',
            'pointerdown': 'mousedown',
            'pointermove': 'mousemove',
            'pointerup': 'mouseup',
            'pointerout': 'mouseout',
            'pointerover': 'mouseover',
            'pointerhover': 'mouseover'

        };

        var pointerToMSPointerMap = {
            'pointer': 'click',
            'pointerdown': 'MSPointerDown',
            'pointermove': 'MSPointerMove',
            'pointerup': 'MSPointerUp',
            'pointerout': 'MSPointerOut',
            'pointerover': 'MSPointerOver',
            'pointerhover': 'MSPointerHover'
        };

        var DomElementFunctions = {

            $classAttributes: [
                /^\$/,
                /^xmlns/,
                /^on/,
                "cid",
                /^_/, // private attributes,
                'animationClass',
                'initializeInvisibleChildren'
            ],

            defaults: {

                /***
                 * sets the class for the Component.
                 * The resulting class attributes is the union from class and componentClass of the Element.
                 *
                 * @type String
                 */
                "class": null,

                /***
                 * sets the componentClass for the Component.
                 * The resulting class attributes is the union from class and componentClass of the Element.
                 *
                 * @type String
                 */
                componentClass: null,

                /**
                 *
                 */
                animationClass: null,
                /***
                 * sets the visibility of an component. If the value is false the component is removed from the DOM.
                 *
                 * @type {Boolean}
                 */
                visible: true,

                /**
                 * if true the children are initialized even when the element is not visible
                 *
                 * @type {Boolean}
                 */
                initializeInvisibleChildren: false,

                /**
                 * @type Boolean
                 */
                enabled: true
            },

            ctor: function (attributes, descriptor, systemManager, parentScope, rootScope, cidScope) {
                this.$addedToDom = false;
                this.$renderMap = {};
                this.$children = [];
                this.$invisibleChildMap = {};
                this.$animationDurationCache = {};
                this.$renderedChildren = [];
                this.$contentChildren = [];
                this.$domEventHandler = {};
                this.factory.$domNodeAttributeCache = this.factory.$domNodeAttributeCache || {};
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

                this.bind('dom:add', this._onDomAdded, this);
                this.bind('dom:remove', this._onDomRemoved, this);
            },

            /**
             * This method is called when the stage or the parent is added to the DOM
             * @private
             */
            _onDomAdded: function () {
                this.$addedToDom = true;
                for (var i = 0; i < this.$renderedChildren.length; i++) {
                    this.$renderedChildren[i].trigger('dom:add', this.$el);
                }
            },

            /**
             * This method is called when the element is removed from DOM
             * @private
             */
            _onDomRemoved: function () {
                this.$addedToDom = false;
                for (var i = 0; i < this.$renderedChildren.length; i++) {
                    this.$renderedChildren[i].trigger('dom:remove', this.$el);
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
                        var pos = options && options.childIndex != null ? options.childIndex : this.$children.length;

//                        this.$children.splice(pos, 0, child);
                        if (this.isRendered()) {
                            this._renderChild(child, pos);
                        }
                    } else if (child instanceof Content) {
                        this.$contentChildren.push(child);
                    }

                }
            },

            _initializeChildren: function (children) {
                if (this.$.initializeInvisibleChildren || this.$.visible) {
                    this.callBase();
                } else {
                    this._$invisibleChildren = children;
                }
            },


            removeChild: function (child) {
                this.callBase();
                if (child instanceof DomElement || child.render) {
                    if (this.isRendered()) {
                        this._removeRenderedChild(child);
                    }
                }
            },

            getPlaceHolder: function (name) {
                var element;
                for (var i = 0; i < this.$children.length; i++) {
                    element = this.$children[i];
                    if (element.render instanceof Function && element.$.name === name) {
                        return element;
                    }
                }
                var placeholder;
                for (i = 0; i < this.$children.length; i++) {
                    element = this.$children[i];
                    if (element.getPlaceHolder) {
                        placeholder = element.getPlaceHolder(name);
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

            getViewChildren: function () {
                var ret = [];
                for (var i = 0; i < this.$children.length; i++) {
                    if (this.$children[i].render instanceof Function) {
                        ret.push(this.$children[i]);
                    }
                }
                return ret;
            },

            getContentPlaceHolders: function (from) {

                if (!ContentPlaceHolder) {
                    ContentPlaceHolder = require('js/ui/ContentPlaceHolder');
                }

                var ret = [];

                var child;
                for (var i = 0; i < this.$children.length; i++) {
                    child = this.$children[i];

                    if (ContentPlaceHolder && child instanceof ContentPlaceHolder && (!from || child.$fromDescriptor === from)) {
                        ret.push(child);
                    } else if (child instanceof DomElement) {
                        ret = ret.concat(child.getContentPlaceHolders(from));
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


                if (this.$stage.$applicationContext.$config["enableInspection"] === true) {
                    var self = this;
                    this.$el.inspect = function () {
                        return self;
                    }
                }

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

            _renderEnabled: function (enabled) {
                if ("disabled" in this.$el) {
                    if (!enabled) {
                        this.$el.setAttribute('disabled', true);
                    } else {
                        this.$el.removeAttribute('disabled');
                    }
                }
                if (enabled) {
                    this.removeClass('disabled');
                } else {
                    this.addClass('disabled');
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
                    if (child.$.visible) {
                        delete this.$invisibleChildMap[child.$cid];
                        var el = child.render();

                        if (pos == undefined) {
                            this.$el.appendChild(el);
                            this.$renderedChildren.push(child);
                        } else {
                            var dec = 0;
                            // decrease the pos by the number of invisible children and elements before
                            for (var i = 0; i < pos && i < this.$children.length; i++) {
                                var element = this.$children[i];
                                if (!element.render || !element.$.visible) {
                                    dec++;
                                }
                            }
                            pos -= dec;
                            this.$renderedChildren.splice(pos, 0, child);
                            var childNode = this.$el.childNodes[pos];
                            if (childNode) {
                                this.$el.insertBefore(el, childNode);
                            } else {
                                this.$el.appendChild(el);
                            }
                        }


                        if (child.$.animationClass) {
                            var animationClass = child.$.animationClass + "-add";
                            child.addClass(animationClass);

                            var time = this.$animationDurationCache[animationClass] || this._calculationAnimationDuration(child);
                            this.$animationDurationCache[animationClass] = time;


                            setTimeout(function () {
                                child.removeClass(animationClass);
                            }, time);
                        }

                        if (this.$addedToDom) {
                            child.trigger('dom:add', this.$el);
                        }
                    } else {
                        this.$invisibleChildMap[child.$cid] = child;
                    }
                }
            },

            _calculationAnimationDuration: function (child) {
                var style = window.getComputedStyle(child.$el, null),
                    vendorPrefix = this.$stage.$browser.vendorPrefix;

                function animation(key) {
                    var ret = [vendorPrefix, "Animation", key].join("");
                    if (vendorPrefix === "o") {
                        ret = ret.toLowerCase();
                    }
                    return ret;
                }

                function transition(key) {
                    var ret = [vendorPrefix, "Transition", key].join("");
                    if (vendorPrefix === "o") {
                        ret = ret.toLowerCase();
                    }
                    return ret;
                }

                // TODO: use correct vendor styles
                var delay = Math.max(parseFloat(style[animation("Delay")]), parseFloat(style[transition("Delay")])) || 0,
                    duration = Math.max(parseFloat(style[animation("Duration")]), parseFloat(style[transition("Duration")])) || 0,
                    count = Math.max(parseInt(style[animation("Count")]), parseInt(style[transition("Count")])) || 1;


                return ((delay + duration) * count) * 1000;
            },
            /**
             *
             * @param selected
             * @private
             */
            _renderSelected: function (selected) {
                if (selected) {
                    this.addClass('active');
                } else {
                    this.removeClass('active');
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
                            this._internalRemoveChild(child);
                            this.$renderedChildren.splice(i, 1);
                            return;
                        }
                    }
                }
            },

            _internalRemoveChild: function (child) {
                if (!child.$.visible) {
                    return;
                }
                var el = this.$el;
                // animation stuff
                if (child.$.animationClass) {
                    var addAnimationClass = child.$.animationClass + "-add";
                    if (child.hasClass(addAnimationClass)) {
                        child.removeClass(addAnimationClass);
                    }
                    var animationClass = child.$.animationClass + "-remove";
                    child.addClass(animationClass);

                    var time = this.$animationDurationCache[animationClass] || this._calculationAnimationDuration(child);
                    this.$animationDurationCache[animationClass] = time;

                    setTimeout(function () {
                        el.removeChild(child.$el);
                        child.trigger('dom:remove', el);
                    }, time);
                } else {
                    this.$el.removeChild(child.$el);
                    child.trigger('dom:remove', this.$el);
                }
            },

            _clearRenderedChildren: function () {
                if (this.isRendered()) {
                    var rc;
                    for (var i = this.$renderedChildren.length - 1; i >= 0; i--) {
                        rc = this.$renderedChildren[i];
                        this._internalRemoveChild(rc);
                    }
                }
                this.$renderedChildren = [];
            },

            _getIndexOfPlaceHolder: function (placeHolder) {
                if (this.$layoutTpl) {
                    var child,
                        placeHolderId;
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
                var renderMethods = this.factory.$renderMethods || {};
                var method = renderMethods[key];
                var prev = this.$previousAttributes[key];

                if (_.isUndefined(method)) {
                    // generic call of render functions

                    var k = key.charAt(0).toUpperCase() + key.substr(1);
                    var methodName = "_render" + k;
                    method = this[methodName];

                    if (!_.isFunction(method)) {
                        method = false;
                    }

                    renderMethods[key] = method;
                    this.factory.$renderMethods = renderMethods;
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
                if (this.factory.$domNodeAttributeCache.hasOwnProperty(key)) {
                    return this.factory.$domNodeAttributeCache[key];
                }
                var cAttr,
                    ret = true;
                for (var i = 0; i < this.$classAttributes.length; i++) {
                    cAttr = this.$classAttributes[i];
                    if (cAttr instanceof RegExp) {
                        if (cAttr.test(key)) {
                            ret = false;
                            break;
                        }
                    } else {
                        if (cAttr == key) {
                            ret = false;
                            break;
                        }
                    }
                }

                this.factory.$domNodeAttributeCache[key] = ret;

                return ret;
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
                        this.$el.setAttributeNS(namespaceUri, key, value);
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
                if (attributes.hasOwnProperty("visible") && attributes.visible) {
                    if (this._$invisibleChildren) {
                        this._initializeChildren(this._$invisibleChildren);
                        this._$invisibleChildren = null;
                        this._initializeBindingsBeforeComplete();
                        if (this.isRendered()) {
                            this._renderContentChildren(this.$contentChildren);
                        }
                    }
                    if (this.$renderParent && !this.isRendered()) {
                        if (attributes.visible) {
                            // calculate the index, where the element should appear
                            var children = this.$renderParent.$children,
                                index = children.indexOf(this);
                            this.$renderParent._renderChild(this, index);
                        }
                    }
                }
            },
            _innerDestroy: function () {
                if (this.$children) {
                    for (var i = 0; i < this.$children.length; i++) {
                        this.$children[i].destroy();
                    }
                }
                this.callBase();
            },
            html: function () {
                if (!this.isRendered()) {
                    this.render();
                }
                return this.$el.innerHTML;

            }.on('change'),
            dom: function (element) {
                return new DomManipulation(element || this, this.$stage);
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
                if (this.isRendered()) {
                    var index = this.$renderedChildren.indexOf(child);
                    if (index > -1) {
                        this.$renderedChildren.splice(index, 1);
                        if (child.$el.parentNode) {
                            this.$el.removeChild(child.$el);
                        }
                        this.$invisibleChildMap[child.$cid] = child;
                    }
                }
            },
            setChildVisible: function (child) {
                if (this.isRendered() && this.$invisibleChildMap[child.$cid]) {
                    if (!child.isRendered()) {
                        child.render();
                    }
                    var next = this._getNextVisibleChild(child);
                    if (next) {
                        var index = this.$renderedChildren.indexOf(next);
                        this.$renderedChildren.splice(index, 0, child);
                        this.$el.insertBefore(child.$el, next.$el);
                    } else {
                        this.$renderedChildren.push(child);
                        this.$el.appendChild(child.$el);
                    }
                    if (this.$addedToDom) {
                        child.trigger('dom:add', this.$el);
                    }
                    delete this.$invisibleChildMap[child.$cid];
                }
            },
            _getNextVisibleChild: function (child) {
                if (this.$el.childNodes.length === 0) {
                    return null;
                }
                var index = this.$children.indexOf(child),
                    renderedChild;
                for (var i = index + 1; i < this.$children.length; i++) {
                    renderedChild = this.$children[i];
                    if (renderedChild.render instanceof Function && !this.$invisibleChildMap[renderedChild.$cid] && renderedChild.$.visible) {
                        break;
                    }
                }
                if (i < this.$children.length && child !== this.$children[i]) {
                    return this.$children[i];
                }
                return null;
            },
            _createDOMEventHandler: function (type) {
                if (type.indexOf("on:pointer") === 0) {
                    return new DomElement.PointerEventHandler(this, type);
                }
                return new DomElement.EventHandler(this, type);
            },
            bind: function (type, eventHandler, scope) {
                if (type.indexOf("on:") === 0 && !this.$domEventHandler[type] && !this._isComponentEvent(type)) {
                    if (this.isRendered()) {
                        var cb = this.$domEventHandler[type] = this._createDOMEventHandler(type);
                        this.bindDomEvent(type.substr(3), cb);
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
            }
        };

        var DomManipulationFunctions = {
            hasClass: function (value) {
                return new RegExp("\\b" + value + "\\b").test(this.$el.getAttribute("class") || "");
            },

            addClass: function (value) {
                var classNames = ("" + value).split(rspace);

                var className = this.$el.getAttribute("class") || "";

                if (!className && classNames.length === 1) {
                    className = value;
                } else {
                    var setClasses = className.split(rspace);

                    for (var i = 0; i < classNames.length; i++) {
                        if (setClasses.indexOf(classNames[i]) == -1) {
                            setClasses.push(classNames[i]);
                        }
                    }
                    className = setClasses.join(" ");

                }
                // IMPORTANT: use setAttribute otherwise the css classes won't be set on SVG elements
                this.$el.setAttribute("class", className);
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

            bindDomEvent: function (type, cb, useCapture) {
                useCapture = !!useCapture;
                var originalType = type;
                type = this._mapDOMEventType(type);

                if (this.$el.addEventListener) {
                    this.$el.addEventListener(type, cb, useCapture);
                } else if (this.$el.attachEvent && !useCapture) {
                    var callback = cb;
                    if (cb instanceof DomElement.EventHandler) {
                        callback = cb._handleEvent = function (e) {
                            return cb.handleEvent(e);
                        };
                    }
                    this.$el.attachEvent("on" + type, callback);
                }
                // register a click listener for the case the device supports mouse and touch (e.g. chrome under windows 8 metro)
                if (/pointer/.test(originalType) && /touch/.test(type)) {
                    this.bindDomEvent(pointerToMouseMap[originalType], cb, useCapture);
                }
            },
            unbindDomEvent: function (type, cb, useCapture) {
                useCapture = !!useCapture;
                var originalType = type;
                type = this._mapDOMEventType(type);

                if (this.$el.removeEventListener) {
                    this.$el.removeEventListener(type, cb, useCapture);
                } else if (this.$el.detachEvent && !useCapture) {
                    var callback = cb;
                    if (cb instanceof DomElement.EventHandler) {
                        callback = cb._handleEvent;
                    }

                    this.$el.detachEvent("on" + type, callback);
                }
                // unregister click listener for the case the device supports mouse and touch (e.g. chrome under windows 8 metro)
                if (/pointer/.test(originalType) && /touch/.test(type)) {
                    this.unbindDomEvent(pointerToMouseMap[originalType], cb, useCapture);
                }
            },

            _mapDOMEventType: function (type) {
                if (type.indexOf("pointer") === 0) {
                    if (this.$stage.$window.PointerEvent) {
                        return type === "pointer" ? "click" : type;
                    } else if (this.$stage.$browser.msPointerEnabled) {
                        return pointerToMSPointerMap[type] || type;
                    } else if (this.$stage.$browser.hasTouch) {
                        return pointerToTouchMap[type] || type;
                    } else {
                        return pointerToMouseMap[type] || type;
                    }
                }
                return type;
            },

            focus: function () {
                if (this.isRendered()) {
                    this.$el.focus();
                }
            },

            blur: function () {
                if (this.isRendered()) {
                    this.$el.blur();
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
            ctor: function (elm, stage) {
                this.$stage = stage;
                this.$el = elm;
            }
        }, DomManipulationFunctions));

        var DomElement = Component.inherit("js.core.DomElement",
            _.extend(DomElementFunctions, DomManipulationFunctions));

        /***
         *
         * @inherit js.core.EventDispatcher.Event
         */
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

        /***
         * @inherit js.core.DomElement.Event
         */
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

        /***
         * @inherit js.core.DomElement.EventHandler
         */
        DomElement.PointerEventHandler = DomElement.EventHandler.inherit('js.core.DomEvent.PointerEventHandler', {
            _createEvent: function (domEvent) {
                return new DomElement.PointerEvent(domEvent);
            }
        });

        return DomElement;
    });