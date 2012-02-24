var requirejs = (typeof requirejs === "undefined" ? require("requirejs") : requirejs);

requirejs(["rAppid"], function (rAppid) {
    rAppid.defineClass("js.html.DomElement",
        ["js.core.Component", "js.core.Binding", "underscore"], function (Component, Binding, _) {

            var rspace = /\s+/;

            var DomElementFunctions = {
                defaults: {
                    selected: false,
                    selectable: false
                },
                ctor: function (attributes, descriptor, applicationDomain, parentScope, rootScope) {
                    this.callBase();
                    this.$renderMap = {};

                    if (descriptor) {
                        if (!this.$tagName) {
                            this.$tagName = descriptor.localName;
                        }
                        if (!this.$namespace) {
                            this.$namespace = descriptor.namespaceURI;
                        }
                    }
                },
                _initializeAttributes: function (attributes) {
                    this.callBase();

                    if (attributes.tagName) {
                        this.$tagName = attributes.tagName;
                    }
                },
                addChild: function (child) {
                    this.callBase();
                    if (this.isRendered()) {
                        this._renderChild(child);
                    }
                },
                getPlaceholder: function (name) {
                    for (var i = 0; i < this.$children.length; i++) {
                        if (this.$children[i].$.name === name) {
                            return this.$children[i];
                        }
                    }
                    var placeholder;
                    for (i = 0; i < this.$children.length; i++) {
                        if (this.$children[i].getPlaceholder) {
                            placeholder = this.$children[i].getPlaceholder(name);
                            if (placeholder) {
                                return placeholder;
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

                    this.$el = document.createElement(this.$tagName);

                    // TODO: read layout and create renderMAP
                    /**
                     * <js:Template name="layout"><placeholder cid="icon"/><placeholder cid="label"/></js:Template>
                     */

                    this._renderChildren(this.$children);
                    this._renderAttributes(this.$);
                    this._bindDomEvents(this.$el);

                    return this.$el;
                },
                _bindDomEvents: function (el) {
                    var self = this;

                    if (this.$el.tagName == "INPUT") {
                        if (this.$el.type == "text" || this.$el.type == "password") {
                            this.$el.addEventListener('change', function (e) {
                                self.set('value', e.target.value);
                            });
                        } else if (this.$el.type == "checkbox") {
                            this.$el.addEventListener('change', function (e) {
                                self.set('checked', e.target.checked);
                            });
                        }


                    }

                },
                _renderChildren: function (children) {
                    // for all children
                    var child;
                    for (var i = 0; i < children.length; i++) {
                        child = children[i];
                        this._renderChild(child);
                    }
                },
                _renderChild: function (child) {
                    if (_.isFunction(child.render)) {
                        var el = child.render();
                        if (el) {
                            this.$el.appendChild(el);
                        }
                    }
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
                        if (attributes.hasOwnProperty(key) && key.indexOf("$") !== 0 && key.indexOf("data") !== 0){
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
                        var k = key[0].toUpperCase() + key.substr(1);
                        var methodName = "_render" + k;
                        method = this[methodName];

                        if (!_.isFunction(method)) {
                            method = false;
                        }

                        this.$renderMap[key] = method;
                    }
                    if (method !== false) {
                        method.call(this, attr, prev);
                    } else if (this.className && this.className.indexOf("js.html.") > -1) {
                        if (!_.isUndefined(this.$el[key])) {
                            this.$el[key] = attr;
                        } else {
                            this.$el.setAttribute(key, attr);
                        }
                    }
                },

                _renderVisible: function (visible) {
                    if (visible === true) {
                        this.removeClass('hidden');
                    } else if (visible === false) {
                        this.addClass('hidden');
                    }
                },
                _renderHidden: function(hidden){
                    if(typeof(hidden) !== "undefined"){
                        this.set({visible:!hidden});
                    }
                },
                _renderSelected: function (selected) {
                    if (selected === true) {
                        this.addClass('active');
                    } else if (selected === false) {
                        this.removeClass('active');
                    }
                },
                _renderSelectable: function (selectable) {
                    if (selectable === true) {
                        var self = this;
                        this.$el.addEventListener('click', function (e) {
                            // e.preventDefault();
                            self.set({selected: !self.$.selected});
                        });
                    } else {
                        this.set({selected: false});
                    }
                },
                _renderWidth: function (width) {
                    // TODO: implement
                },
                _renderHeight: function (height) {
                    // TODO: implement
                },
                _commitChangedAttributes: function (attributes) {
                    if (this.isRendered()) {
                        this._renderAttributes(attributes);
                    }
                },

                dom: function (element) {
                    return new DomManipulation(element || this);
                }

            };

            var DomManipulationFunctions = {
                hasClass: function (value) {
                    // var classes = this.$el.className.split(" "+value+" ");

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
                    if (this.$el.className.length === 0) {
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
                }
            };

            var DomManipulation = inherit.Base.inherit(_.extend({
                ctor: function (elm) {
                    this.$el = elm;
                }
            }, DomManipulationFunctions));

            return Component.inherit(_.extend(DomElementFunctions, DomManipulationFunctions));
        }
    );
});