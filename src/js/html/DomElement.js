rAppid.defineClass("js.html.DomElement",
    ["js.core.Component","js.core.Binding"], function (Component, Binding) {
        return Component.inherit({
                _construct:function (descriptor, applicationDomain, scope) {
                    this.callBase();

                    if (this.$descriptor) {
                        if (!this.$tagName) {
                            this.$tagName = this.$descriptor.localName;
                        }
                        if (!this.$namespace) {
                            this.$namespace = this.$descriptor.namespaceURI;
                        }
                    }
                },
                _initializeAttributes:function (attributes) {
                    this.callBase();

                    if (attributes.tagName) {
                        this.$tagName = attributes.tagName;
                    }
                },
                render:function () {
                    if (!this.$initialized) {
                        this._initialize(this.$creationPolicy);
                    }
                    // check if it is already rendered
                    if (this.isRendered()) {
                        return this.$el;
                    }

                    this.$el = document.createElement(this.$tagName);

                    // TODO: bind the events
                    var self = this;
                    this.$el.onclick = function(e){
                        self.trigger('onclick',e, self);
                    }

                    this._renderAttributes(this.$);

                    // for all children
                    var child;
                    for (var i = 0; i < this.$children.length; i++) {
                        child = this.$children[i];
                        this._renderChild(child);
                    }

                    return this.$el;
                },
                _renderChild: function(child){
                    if (_.isFunction(child.render)) {
                        var el = child.render();
                        if (el) {
                            this.$el.appendChild(el);
                        }
                    }
                },
                isRendered:function () {
                    return typeof (this.$el) !== "undefined";
                },
                _renderAttributes:function (attributes) {
                    var attr;
                    for (var key in attributes) {
                        if (key.indexOf("$") !== 0 && attributes.hasOwnProperty(key)) {
                            attr = attributes[key];
                            this._renderAttribute(key,attr);
                        }
                    }
                },
                _renderAttribute: function(key,attr){
                    this.$el.setAttribute(key, new String(attr));
                },
                _commitChangedAttributes:function (attributes) {
                    if(this.isRendered()){
                        this._renderAttributes(attributes);
                    }

                }
            }
        )
    }
);