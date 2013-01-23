define(['js/core/DomElement', 'underscore'], function (DomElement, _) {

    var HTML_Namespace = "http://www.w3.org/1999/xhtml",
        POLICY_OUT = 'out',
        POLICY_IN = 'in',
        POLICY_BOTH = 'both',
        attributeMap = {
            height: 'offsetHeight',
            width: 'offsetWidth'
        };

    /**
     * Sets the size of an element, if the policy requires it
     * @param element
     * @param policy
     * @param attribute
     */
    var checkSizePolicy = function(element, policy, attribute){
        if (policy === POLICY_IN || policy === POLICY_BOTH) {
            element.set(attribute, element.$el[attributeMap[attribute]]);
        }
    };

    /**
     * Binds the window resize event and sets the size on resize if the policy requires it
     * @param element
     * @param policy
     * @param attribute
     */
    var bindSizePolicy = function (element, policy, attribute) {

        if (policy === POLICY_IN || policy === POLICY_BOTH) {
            if (!element["__update"+attribute]) {
                var self = element;
                element["__update" + attribute] = function () {
                    self.set(attribute, self.$el[attributeMap[attribute]]);
                };
                element.dom(element.$stage.$window).bindDomEvent('resize', element["__update" + attribute]);
            }
        } else {
            if (element["__update" + attribute]) {
                element.dom(element.$stage.$window).unbindDomEvent('resize', element["__update" + attribute]);
                delete element["__update" + attribute];
            }
        }

    };

    var HtmlElement = DomElement.inherit("js.html.HtmlElement", {

        defaults: {
            selected: undefined,
            selectable: undefined,
            namespace: HTML_Namespace,
            enabled: true,
            position: null,

            heightUpdatePolicy: POLICY_OUT,
            widthUpdatePolicy: POLICY_OUT
        },

        $classAttributes: ['heightUpdatePolicy', 'widthUpdatePolicy', 'content'],

        $excludedStyleAttributes: ['src','content'],

        $renderAsStyleWithPx: ['left', 'top'],
        /**
         *
         * @private
         */
        _onDomAdded: function(){
            this.callBase();

            checkSizePolicy(this,this.$.widthUpdatePolicy,'width');
            checkSizePolicy(this,this.$.heightUpdatePolicy,'height');
        },
        /**
         *
         * @param policy
         * @private
         */
        _renderHeightUpdatePolicy: function (policy) {
            bindSizePolicy(this, policy, "height");
        },
        /**
         *
         * @param policy
         * @private
         */
        _renderWidthUpdatePolicy: function (policy) {
            bindSizePolicy(this, policy, "width");
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
        /**
         *
         * @param key
         * @param value
         * @private
         */
        _setAttribute: function (key, value) {

            if (_.indexOf(this.$renderAsStyleWithPx, key) !== -1) {
                if (!_.isString(value)) {
                    value += "px";
                }
            }

            this.callBase(key, value);

        },
        /**
         *
         * @param selectable
         * @private
         */
        _renderSelectable: function (selectable) {
            if (selectable) {
                if (!this._onSelect) {
                    var self = this;
                    this._onSelect = function () {
                        if(self.$.enabled){
                            self.set({selected: !self.$.selected});
                        }
                    };
                }
                this.bindDomEvent('click', this._onSelect);
            } else {
                if (this._onSelect) {
                    this.unbindDomEvent('click', this._onSelect);
                }
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

        /***
         * renders the width of the element if the update-policy allows out-going
         * @param width - the width in pixel if not a string
         * @private
         */
        _renderWidth: function (width) {

            if (width !== undefined && width !== null && typeof(width) !== "string") {
                width += "px";
            }

            this._renderPolicyValue('width', width);
        },

        /***
         * renders the height of the element if the update-policy allows out-going
         * @param height - the width in pixel if not a string
         * @private
         */
        _renderHeight: function (height) {

            if (height !== undefined && height !== null && typeof(height) !== "string") {
                // TODO: check browser
                height = Math.min(17895697, height); // max height in firefox
                height += "px";
            }

            this._renderPolicyValue('height', height);
        },

        /***
         *
         * @param name
         * @param value
         * @private
         */
        _renderPolicyValue: function (name, value) {
            var policy = this.$[name + 'UpdatePolicy'];

            if (policy === POLICY_OUT || policy === POLICY_BOTH) {
                if(value != null && value !== undefined){
                    this.$el.style[name] = value;
                }
            }

        },

        _renderAttributeInternal: function(key, value) {
            if (this._isStyleAttribute(key)) {
                if (_.indexOf(this.$renderAsStyleWithPx, key) !== -1) {
                    if (!_.isString(value)) {
                        value += "px";
                    }
                }

                if(value){
                    if (key in this.$el.style) {
                        this.$el.style[key] = value;
                    } else {

                        var transformedKey = HtmlElement.transformCache[key];

                        if (!transformedKey) {
                            // transform key
                            var split = key.split("-");
                            transformedKey = split[0];
                            for (var i = 1; i < split.length; i++) {
                                transformedKey += split[i].charAt(0).toUpperCase() + split[1].substr(1);
                            }

                            HtmlElement.transformCache[key] = transformedKey;
                        }

                        if (transformedKey in this.$el.style) {
                            this.$el.style[transformedKey] = value;
                        }
                    }
                }

            } else {
                this.callBase();
            }
        },

        _isStyleAttribute: function(key) {

            var supportedCssProperties = this.$stage.$supportedCssProperties;

            if (!supportedCssProperties && this.runsInBrowser()) {

                var window = this.$stage.$window,
                    document = this.$stage.$document;

                supportedCssProperties = this.$stage.$supportedCssProperties = [];

                if (document && window) {
                    var body = document.body || document.getElementsByName("body")[0] || document.getElementsByName("html")[0];
                    if (body) {
                        var styles = window.getComputedStyle(body);
                        for (var i = 0; i < styles.length; i++) {
                            supportedCssProperties.push(styles[i]);
                        }
                    }
                }
            }

            return _.indexOf(this.$excludedStyleAttributes, key) === -1 && this.$el && (key in this.$el.style || (supportedCssProperties && _.indexOf(supportedCssProperties, key) !== -1));

        },

        _createDOMEventHandler: function(type){
            return new HtmlElement.EventHandler(this, type);
        }

    });

    HtmlElement.EventHandler = DomElement.EventHandler.inherit('js.html.HtmlElement.EventHandler',{
        handleEvent: function(e){
            if(this._isEventEnabled()){
                this.callBase();
            }else{
                e.preventDefault();
                return false;
            }
        },
        _isEventEnabled: function(){
            if(!this.component.$.enabled){
                if(_.include(['on:click','on:dblclick'],this.type)){
                    return false;
                }
            }
            return true;
        }
    });

    HtmlElement.transformCache = {};

    HtmlElement.HTML_Namespace = HTML_Namespace;

    return HtmlElement;
});