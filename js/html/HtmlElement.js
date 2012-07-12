define(['js/core/DomElement', 'underscore'], function(DomElement, _) {

    var HTML_Namespace = "http://www.w3.org/1999/xhtml";

    var HtmlElement = DomElement.inherit("js.html.HtmlElement", {

        defaults: {
            selected: undefined,
            selectable: undefined,
            namespace: HTML_Namespace,

            position: null,

            heightUpdatePolicy: 'out',
            widthUpdatePolicy: 'out'
        },

        $classAttributes: ['heightUpdatePolicy', 'widthUpdatePolicy'],

        $renderAsStyle: ['position'],

        $renderAsStyleWithPx: ['left', 'top'],

        _renderVisible: function (visible) {
            if (visible === true) {
                this.removeClass('hide');
            } else if (visible === false) {
                this.addClass('hide');
            }
        },

        _renderHidden: function (hidden) {
            if (typeof(hidden) !== "undefined") {
                this.set({visible: !hidden});
            }
        },

        _renderSelected: function (selected) {
            if (selected === true) {
                this.addClass('active');
            } else if (selected === false) {
                this.removeClass('active');
            }
        },

        _setAttribute: function(key, value) {

            var renderAsStyle;
            if (_.indexOf(this.$renderAsStyleWithPx, key) !== -1) {
                if (!_.isString(value)) {
                    value += "px";
                }

                renderAsStyle = true;
            }

            if (renderAsStyle || _.indexOf(this.$renderAsStyle, key) !== -1) {
                this.$el.style[key] = value;
            } else {
                this.callBase();
            }
        },

        _renderSelectable: function (selectable) {
            if (selectable === true) {
                if (!this._onSelect) {
                    var self = this;
                    this._onSelect = function () {
                        self.set({selected: !self.$.selected});
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
            this._renderPolicyValue('width', width);
        },

        /***
         * renders the height of the element if the update-policy allows out-going
         * @param height - the width in pixel if not a string
         * @private
         */
        _renderHeight: function (height) {
            this._renderPolicyValue('height', height);
        },

        _renderPosition: function(position) {
            this.$el.style.position = position;
        },

        _renderPolicyValue: function(name, value) {
            var policy = this.$[name + 'UpdatePolicy'];

            if (policy === 'out' || policy === 'both') {
                if (typeof(value) !== "string") {
                    value += "px";
                }
                this.$el.style[name] = value;
            }

        }

    });

    HtmlElement.HTML_Namespace = HTML_Namespace;

    return HtmlElement;
});