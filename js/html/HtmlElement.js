define(['js/core/DomElement'], function(DomElement) {

    return DomElement.inherit("js/html/HtmlElement", {

        defaults: {
            selected: undefined,
            selectable: undefined
        },

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
        _renderWidth: function (width) {
            if (width) {
                if (typeof(width) !== "string") {
                    width += "px";
                }
                this.$el.style.width = width;
            }
        },
        _renderHeight: function (height) {
            if (height) {
                if (typeof(height) !== "string") {
                    height += "px";
                }
                this.$el.style.height = height;
            }
        }

    });
});