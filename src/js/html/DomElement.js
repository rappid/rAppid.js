rAppid.defineClass("js.html.DomElement",
    ["js.core.Component","js.core.Binding", "underscore"], function (Component, Binding, _) {

        var rspace = /\s+/;

        var DomElementFunctions = {
            ctor: function (attributes, descriptor, applicationDomain, parentScope, rootScope) {
                this.callBase();

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
            getPlaceholder:function (name) {
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



                    // TODO: bind the events
                var self = this;
                this.$el.onclick = function (e) {
                    self.trigger('onclick', e, self);
                };

                this._renderContent();
                this._renderChildren(this.$children);

                this._renderAttributes(this.$);
                return this.$el;
            },
            _renderContent: function () {


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
                    if (key.indexOf("$") !== 0 && attributes.hasOwnProperty(key)) {
                        attr = attributes[key];
                        this._renderAttribute(key, attr);
                    }
                }
            },
            _renderAttribute: function (key, attr) {
                this.$el.setAttribute(key, attr);
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
                var removeClasses = value.split(rspace);
                var classes = this.$el.className.split(rspace);

                for (var i = 0; i < removeClasses; i++) {
                    var index = classes.indexOf(removeClasses[i]);
                    if (index != -1) {
                        classes.splice(index, 1);
                    }
                }

                this.$el.className = classes.join(" ");

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