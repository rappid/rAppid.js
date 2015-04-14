define(['js/core/DomElement', 'underscore'], function (DomElement, _) {

    var HTML_Namespace = "http://www.w3.org/1999/xhtml",
        POLICY_OUT = 'out',
        POLICY_IN = 'in',
        POLICY_BOTH = 'both',
        attributeMap = {
            height: 'offsetHeight',
            width: 'offsetWidth'
        };

    /***
     * Sets the size of an element, if the policy requires it
     * @param element
     * @param policy
     * @param attribute
     */
    var checkSizePolicy = function (element, policy, attribute) {
        if (policy === POLICY_IN || policy === POLICY_BOTH) {
            element.set(attribute, element.$el[attributeMap[attribute]]);
        }
    };

    /***
     * Binds the window resize event and sets the size on resize if the policy requires it
     * @param element
     * @param policy
     * @param attribute
     */
    var bindSizePolicy = function (element, policy, attribute) {

        if (policy === POLICY_IN || policy === POLICY_BOTH) {
            if (!element["__update" + attribute]) {
                var self = element;
                element["__update" + attribute] = function () {
                    // setTimeout fix because of safari iOS bug: height and width are set after event is triggered
                    setTimeout(function () {
                        self.set(attribute, self.$el[attributeMap[attribute]]);
                    }, 1);
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

    /**
     * Represents a HTML Element in the DOM
     */
    var HtmlElement = DomElement.inherit("js.html.HtmlElement", {

        defaults: {
            /**
             * If not null, false or undefined the "active" CSS class is added
             *
             * @type Boolean
             */
            selected: null,

            /**
             * If not null, false or undefined a click will set the element to selected
             * @type Boolean
             */
            selectable: null,

            /***
             * the target namespace for the HTMLElement
             * @type String
             */
            namespace: HTML_Namespace,

            /**
             * Possible values: "absolute", "relative"
             * @type String
             */
            position: null,

            /**
             *
             * The heightUpdatePolicy configures whether the height of the component is
             * updated when the DOM node height changes or if the DOM node height is updated
             * when the component height changes.
             *
             *  **Possible values:**
             *
             *   +  **in** - "height" attribute is determined by DOM nodes offsetHeight
             *   +  **out** - DOM node height is determined by the "height" attribute
             *   +  **both** - both directions
             *
             * @type String
             */
            heightUpdatePolicy: "out",

            /**
             *
             * The widthUpdatePolicy configures whether the width of the component is
             * updated when the DOM node width changes or if the DOM node width is updated
             * when the component width changes.
             *
             *  **Possible values:**
             *
             *   +  **in** - "width" attribute is determined by DOM nodes offsetWidth
             *   +  **out** - DOM node width is determined by the "width" attribute
             *   +  **both** - both directions
             *
             * @type String
             */
            widthUpdatePolicy: "out"
        },

        /**
         * @type Array
         */
        $classAttributes: ['heightUpdatePolicy', 'widthUpdatePolicy', 'content'],

        /**
         * @type Array
         */
        $excludedStyleAttributes: ['src', 'content', 'item'],

        /***
         * @type Array
         */
        $renderAsStyleWithPx: ['left', 'top', 'maxWidth', 'maxHeight'],

        /**
         *
         * @private
         */
        _onDomAdded: function () {
            this.callBase();

            this.checkSizePolicies();
        },
        /**
         * Checks if the element has the correct width and height according to the width and height update policy
         */
        checkSizePolicies: function () {
            checkSizePolicy(this, this.$.widthUpdatePolicy, 'width');
            checkSizePolicy(this, this.$.heightUpdatePolicy, 'height');
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
         * @param key
         * @param value
         * @private
         */
        _setAttribute: function (key, value) {

            if (_.indexOf(this.$renderAsStyleWithPx, key) !== -1) {
                if (value != null && !_.isString(value)) {
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
                        if (self.$.enabled) {
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
                if (value != null && value !== undefined) {
                    this.$el.style[name] = "" + value;
                }
            }

        },

        _renderAttributeInternal: function (key, value) {
            if (this._isStyleAttribute(key)) {
                if (_.indexOf(this.$renderAsStyleWithPx, key) !== -1) {
                    if (value != null && !_.isString(value)) {
                        value += "px";
                    }
                }

                var dashKey,
                    camelCaseKey,
                    transformedKey,
                    i;

                if (/-/.test(key)) {
                    // has dash
                    dashKey = key;

                    transformedKey = HtmlElement.dashFormatTransformCache[key];

                    if (!transformedKey) {

                        var parts = key.split("-");
                        // transform key
                        transformedKey = parts[0];
                        for (i = 1; i < parts.length; i++) {
                            transformedKey += parts[i].charAt(0).toUpperCase() + parts[i].substr(1);
                        }

                        HtmlElement.dashFormatTransformCache[key] = transformedKey;
                    }

                    camelCaseKey = transformedKey;

                } else {

                    camelCaseKey = key;

                    transformedKey = HtmlElement.camelCaseFormatTransformCache[key];

                    if (!transformedKey) {
                        // transform key
                        var split = key.split(/(?=[A-Z])/);
                        transformedKey = split[0];
                        for (i = 1; i < split.length; i++) {
                            transformedKey += "-" + split[i].charAt(0).toLowerCase() + split[i].substr(1);
                        }

                        HtmlElement.camelCaseFormatTransformCache[key] = transformedKey;
                    }

                    dashKey = transformedKey;
                }


                var style = this.$el.style;
                if (style && camelCaseKey in style) {
                    if (value != null) {
                        // value needs to be set as string otherwise IE9
                        // will throw an exception for negative values like -12
                        value = "" + value;
                        style[dashKey] = value;
                        if (!this.$stage.$browser.isIE && style.setProperty) {
                            style.setProperty(dashKey, value, null);
                        }
                    } else {
                        if (style.setProperty) {
                            style.removeProperty(dashKey);
                        } else {
                            style.removeAttribute(dashKey);
                        }
                    }
                }

            } else {
                // HACK FOR FF AND IE TO CLEAR THE IMAGE BEFORE SETTING A NEW ONE
                if (key === "src" && (this.$stage.$browser.isFF || this.$stage.$browser.isIE)) {
                    this.$el.removeAttribute(key);
                }
                this.callBase();
            }
        },

        _isStyleAttribute: function (key) {

            var supportedCssProperties = this.$stage.$supportedCssProperties;

            if (!supportedCssProperties && this.runsInBrowser()) {

                var window = this.$stage.$window,
                    document = this.$stage.$document;

                supportedCssProperties = this.$stage.$supportedCssProperties = [];

                if (document && window) {
                    var body = document.body || document.getElementsByName("body")[0] || document.getElementsByName("html")[0];
                    if (body) {
                        // can return null in FF see https://bugzilla.mozilla.org/show_bug.cgi?id=548397
                        var styles = window.getComputedStyle(body, null) || [];
                        for (var i = 0; i < styles.length; i++) {
                            supportedCssProperties.push(styles[i]);
                        }
                    }
                }
            }

            return _.indexOf(this.$excludedStyleAttributes, key) === -1 && this.$el && ((this.$el.style && key in this.$el.style) || (supportedCssProperties && _.indexOf(supportedCssProperties, key) !== -1));

        }
    });

    HtmlElement.camelCaseFormatTransformCache = {};
    HtmlElement.dashFormatTransformCache = {};

    HtmlElement.HTML_Namespace = HTML_Namespace;

    return HtmlElement;
});