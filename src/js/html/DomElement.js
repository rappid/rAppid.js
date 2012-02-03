rAppid.defineClass("js.html.DomElement",
    ["js.core.Component"], function (Component) {
        return Component.inherit({
                ctor: function (attributes) {
                    this.base.ctor.callBase(this, attributes);

                    if (attributes) {
                        this.$tagName = attributes.tagName;
                    }
                },
                _construct: function (descriptor, applicationDomain) {
                    this.base._construct.callBase(this, descriptor, applicationDomain);

                    if (this.$descriptor) {
                        if (!this.$tagName) {
                            this.$tagName = this.$descriptor.localName;
                        }
                        if (!this.$namespace) {
                            this.$namespace = this.$descriptor.namespaceURI;
                        }
                    }
                },
                _initializeAttributes: function (attributes) {
                    this.base._initializeAttributes.callBase(this, attributes);

                    if (attributes.tagName) {
                        this.$tagName = attributes.tagName;
                    }
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

//                    this._renderWidth(this.$.width);
//                    this._renderClassName(this.$.className);
                    // bind events -> on ...
                    // this._registerEvents(['click','mouseover','mouseout','keydown']);

                    // for all children
                    var child;
                    for (var i = 0; i < this.$children.length; i++) {
                        child = this.$children[i];
                        if (_.isFunction(child.render)) {
                            var el = child.render();
                            if (el) {
                                this.$el.appendChild(el);
                            }
                        }
                    }

                    return this.$el;
                },
                isRendered: function () {
                    return typeof (this.$el) !== "undefined";
                }
            }
        )
    }
);