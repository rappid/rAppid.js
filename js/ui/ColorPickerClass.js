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
        _imageMouseDown: function (e) {
            e.preventDefault();
        },

        _paletteMouseDown: function (e) {
            this.$mouseDown = true;
            var domEvent = e.pointerEvent,
                pos = this.globalToLocal({x: domEvent.pageX, y: domEvent.pageY});

            domEvent.preventDefault();

            this._updateColorAndPaletteCursor(pos);
        },

        _paletteMouseMove: function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.$mouseDown) {
                var domEvent = e.pointerEvent,
                    pos = e.target.globalToLocal({x: domEvent.pageX, y: domEvent.pageY});

                this._updateColorAndPaletteCursor(pos);
            }
        },

        _cursorUp: function () {
            this.$mouseDown = false;
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

            var hsbColor = this.$.color.toHSB();

            this.set('color', new Color.HSB(Math.round(360 * (1 - scale / this.$.paletteSize)), hsbColor.s, hsbColor.b));
        },
        _renderColor: function(color){
            if(color){
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
        _commitColor: function(color, oldColor){
            if(color){
                if(!oldColor || color.toHSB().h !== oldColor.toHSB().h){
                    this.trigger('hueChanged');
                }
            }
        },
        _paletteMouseUp: function (e) {
            this.$mouseDown = false;
        },

        _hueBarMove: function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (this.$hueBarDown) {
                this._updateColorAndHueCursor(e.target.globalToLocal({x:0, y: e.pointerEvent.pageY}).y);
            }
        },

        _hueBarUp: function () {
            this.$hueBarDown = false;
        },

        _hueBarDown: function (e) {
            this.$hueBarDown = true;
            this._updateColorAndHueCursor(e.target.globalToLocal({x: 0, y: e.pointerEvent.pageY}).y);
        },

        _hueSliderUp: function(){
            this.$hueBarDown = false;
        },

        _backgroundColor: function () {
            var hsbColor = this.$.color.toHSB();

            return new Color.HSB(hsbColor.h, 100, 100).toRGB();
        }.on('hueChanged')


    })
});