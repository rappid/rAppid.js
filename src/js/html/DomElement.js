rAppid.defineClass("js.html.DomElement",
    ["js.core.Component","js.core.Binding"], function (Component, Binding) {
        return Component.inherit({
                ctor: function(attributes, descriptor, applicationDomain, parentScope, rootScope) {
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
                _initializeAttributes:function (attributes) {
                    this.callBase();

                    if (attributes.tagName) {
                        this.$tagName = attributes.tagName;
                    }
                },
                addChild: function(child){
                    this.callBase();
                    if(this.isRendered()){
                        this._renderChild(child);
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

                    // TODO: read layout and create renderMAP
                    /**
                     * <js:Template name="layout"><placeholder cid="icon"/><placeholder cid="label"/></js:Template>
                     */



                    // TODO: bind the events
                    var self = this;
                    this.$el.onclick = function(e){
                        self.trigger('onclick',e, self);
                    };

                    this._renderContent();
                    this._renderChildren(this.$children);

                    this._renderAttributes(this.$);
                    return this.$el;
                },
                _renderContent: function(){


                },
                _renderChildren: function(children){
                    // for all children
                    var child;
                    for (var i = 0; i < children.length; i++) {
                        child = this.$children[i];
                        this._renderChild(child);
                    }
                },
                _renderChild: function(child){
                    if (_.isFunction(child.render)) {
                        var el = child.render();
                        if (el) {
                            this.$el.appendChild(el);
                        }
                    }
                },
                _getIndexOfPlaceHolder: function(placeHolder){
                    if (this.$layoutTpl) {
                        var child;
                        for(var i = 0 ; i < this.$layoutTpl.$children.length; i++){
                            child = this.$layoutTpl.$children[i];
                            if(placeHolderId == child.$cid){
                                return i;
                            }
                        }
                    }
                    return -1;
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
                    this.$el.setAttribute(key, attr);
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