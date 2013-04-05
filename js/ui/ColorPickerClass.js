define(['js/ui/View', 'js/type/Color'], function (View, Color) {

    return View.inherit('js.ui.ColorPickerClass', {
        defaults: {
            color: Color.HSB,
            paletteSize: 300,
            _palettePosition: {
                x: 0,
                y: 0
            },
            _scale: 0
        },

        events: ['on:colorSelect'],

        _imageMouseDown: function (e) {
            e.preventDefault();
        },

        _paletteMouseDown: function (e) {
            this.$mouseDown = true;
            var domEvent = e.pointerEvent,
                pos = this.globalToLocal({x: domEvent.pageX, y: domEvent.pageY});

            e.preventDefault();
            var self = this;
            if (!this.$moveHandler) {
                this.$moveHandler = function (e) {
                    e.preventDefault && e.preventDefault();
                    e.stopPropagation();

                    if (self.$mouseDown) {
                        if (e.changedTouches) {
                            e = e.changedTouches[0];
                        }
                        var pos = self.$.paletteImage.globalToLocal({x: e.pageX, y: e.pageY});

                        self._updateColorAndPaletteCursor(pos);
                        self._triggerColorChange();
                    }
                    return false;
                };
            }

            if (!this.$upHandler) {
                this.$upHandler = function () {
                    self.$mouseDown = false;

                    self.dom(self.$stage.$window).unbindDomEvent('pointermove', self.$moveHandler);
                    self.dom(self.$stage.$window).unbindDomEvent('pointerup', self.$upHandler);

                };
            }

            this.dom(this.$stage.$window).bindDomEvent('pointermove', this.$moveHandler);
            this.dom(this.$stage.$window).bindDomEvent('pointerup', this.$upHandler);

            this._updateColorAndPaletteCursor(pos);
            this._triggerColorChange();
        },

        _updateColorAndPaletteCursor: function (pos) {
            pos.x = pos.x < 0 ? 0 : pos.x;
            pos.x = pos.x > this.$.paletteSize ? this.$.paletteSize : pos.x;
            pos.y = pos.y < 0 ? 0 : pos.y;
            pos.y = pos.y > this.$.paletteSize ? this.$.paletteSize : pos.y;
            var b = 100 * (1 - (pos.y / this.$.paletteSize)),
                s = 100 * (pos.x / this.$.paletteSize);

            var hsbColor = this.$.color.toHSB();

            this.set('color', new Color.HSB(hsbColor.h, Math.round(s), Math.round(b)));
        },
        _updateColorAndHueCursor: function (scale) {
            scale = scale < 0 ? 0 : scale;
            scale = scale > this.$.paletteSize ? this.$.paletteSize : scale;

            var hsbColor = this.$.color.toHSB(),
                hue = Math.round(360 * (1 - scale / this.$.paletteSize));

            hue = hue >= 360 ? 359 : hue;

            this.set('color', new Color.HSB(hue, hsbColor.s, hsbColor.b));
        },

        _triggerColorChange: function () {
            this.$triggerColorTimeout && clearTimeout(this.$triggerColorTimeout);

            var self = this;

            this.$triggerColorTimeout = setTimeout(function () {
                self.trigger('on:colorSelect', self.$.color);
            }, 300);
        },

        _renderColor: function (color) {
            if (color) {
                var hsbColor = color.toHSB();
                var pos = {
                    x: Math.round(this.$.paletteSize * hsbColor.s * 0.01),
                    y: Math.round(this.$.paletteSize * (1 - hsbColor.b * 0.01))
                };
                this.set({
                    '_palettePosition': pos,
                    '_scale': Math.round(this.$.paletteSize * (1 - hsbColor.h / 360))
                });
            }
        },
        _commitColor: function (color, oldColor) {
            if (color) {
                if (!oldColor || color.toHSB().h !== oldColor.toHSB().h) {
                    this.trigger('hueChanged');
                }
            }
        },

        _hueBarDown: function (e) {
            this.$hueBarDown = true;
            var self = this;
            if (!this.$hueBarMoveHandler) {
                this.$hueBarMoveHandler = function (e) {
                    e.preventDefault && e.preventDefault();

                    e.stopPropagation();
                    if (self.$hueBarDown) {
                        if (e.changedTouches) {
                            e = e.changedTouches[0];
                        }

                        self._updateColorAndHueCursor(self.$.hueBar.globalToLocal({x: 0, y: e.pageY}).y);
                        self._triggerColorChange();
                    }
                    return false;
                };
            }
            if (!this.$hueBarUpHandler) {
                this.$hueBarUpHandler = function (e) {
                    self.$hueBarDown = false;
                    self.dom(self.$stage.$window).unbindDomEvent('pointermove', self.$hueBarMoveHandler);
                    self.dom(self.$stage.$window).unbindDomEvent('pointerup', self.$hueBarUpHandler);

                };
            }

            this.dom(this.$stage.$window).bindDomEvent('pointermove', this.$hueBarMoveHandler);
            this.dom(this.$stage.$window).bindDomEvent('pointerup', this.$hueBarUpHandler);

            this._updateColorAndHueCursor(e.target.globalToLocal({x: 0, y: e.pointerEvent.pageY}).y);
            this._triggerColorChange();
        },

        _backgroundColor: function () {
            if (this.$.color) {
                var hsbColor = this.$.color.toHSB();
                return new Color.HSB(hsbColor.h, 100, 100).toRGB();
            }

            return Color.RGB(0, 0, 0);

        }.on('hueChanged'),

        _preventDefault: function (e) {
            e.preventDefault();
        }


    });
});