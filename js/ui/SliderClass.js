define(["js/ui/View", 'js/data/Collection', 'js/core/List'], function (View) {

        var ORIENTATION = {
                HORIZONTAL: "horizontal",
                VERTICAL: "vertical"
            };

        return View.inherit('js.ui.SliderClass', {
            defaults: {
                componentClass: "slider",
                position: "relative",
                /**
                 * The minimum value
                 * @type Number
                 */
                min: 1,
                /**
                 * The maximum value
                 * @type Number
                 */
                max: 100,
                /**
                 * The step size which the handler should move
                 * @type Number
                 */
                step: 1,
                /**
                 * If range is true two handles will be shown
                 * @type Boolean
                 */
                range: false,
                /**
                 * The current value
                 * @type Number
                 */
                value: 1,
                /**
                 * The current start value, only used when range is set to true
                 * @type Number
                 */
                startValue: 1,
                /**
                 * The orientation of the slider.
                 * Possible values are "horizontal" and "vertical"
                 *
                 * @type String
                 */
                orientation: ORIENTATION.HORIZONTAL
            },
            events: ["on:input"],

            _handleDown: function (event, handleId) {
                event.preventDefault();
                var window = this.$stage.$window;
                this.$currentHandle = event.target;
                event.target.focus();

                if (!this._windowUpListener || !this._windowMoveListener) {
                    var self = this;
                    this._windowUpListener = function (e) {
                        return self._handleWindowUp(e);
                    };

                    this._windowMoveListener = function (e) {
                        return self._handleWindowMove(e);
                    }
                }

                this.dom(window).bindDomEvent('pointerup', this._windowUpListener);
                this.dom(window).bindDomEvent('pointermove', this._windowMoveListener);

            },

            _getMaxValueForHandle: function (handle) {
                var max = this.$.max;
                if (this.$.range) {
                    if (handle === this.$.startHandle) {
                        max = this.$.value - this.$.step;
                    }

                }
                return max;
            },

            _getMinValueForHandle: function (handle) {
                var min = this.$.min;
                if (this.$.range) {
                    if (handle === this.$.mainHandle) {
                        min = this.$.startValue + this.$.step;
                    }
                }
                return min;
            },

            _getMaxValue: function () {
                var ret = this.$.max;
                if (this.$.range && this.$currentHandle === this.$.mainHandle) {
                    ret = this.$.startValue - this.$step;
                }
                return ret;
            },

            _handleWindowMove: function (e) {
                e.preventDefault && e.preventDefault();
                if (this.$currentHandle) {

                    var pos,
                        range,
                        max,
                        min,
                        v;

                    if (e.changedTouches) {
                        e = e.changedTouches[0];
                    }

                    pos = this.globalToLocal({x: e.pageX, y: e.pageY});


                    range = this.$.max - this.$.min;
                    max = this._getMaxValueForHandle(this.$currentHandle);
                    min = this._getMinValueForHandle(this.$currentHandle);

                    if (this.$.orientation == ORIENTATION.HORIZONTAL) {
                        v = (pos.x / this.$el.offsetWidth) * range;
                    } else {
                        v = ((this.$el.offsetHeight - pos.y) / this.$el.offsetHeight) * range;
                    }

                    v = Math.round(v / this.$.step) * this.$.step;

                    v += this.$.min;

                    var r = (v + this.$.min) % this.$.step;
                    if (r !== 0 && r >= this.$.step * 0.5) {
                        v = v - r + this.$.step;
                    } else {
                        v = v - r;
                    }

                    v = Math.min(max, v);
                    v = Math.max(min, v);

                    if (this.$currentHandle === this.$.mainHandle) {
                        this.set('value', v);
                    } else {
                        this.set('startValue', v);
                    }
                    this.trigger('on:input', {value: this.$.value, startValue: this.$.startValue});

                }

            },

            _handleKeyDown: function (e) {
                var increase = 0,
                    attribute = (e.target === this.$.mainHandle) ? "value" : "startValue";
                switch (e.domEvent.which) {
                    case 39:
                        increase = this.$.step;
                        break;
                    case 37:
                        increase = -this.$.step;
                        break;
                }

                var newValue = this.get(attribute) + increase,
                    max = this._getMaxValueForHandle(e.target),
                    min = this._getMinValueForHandle(e.target);

                newValue = Math.min(max, this.get(attribute) + increase);
                newValue = Math.max(min, newValue);

                this.set(attribute, newValue);
            },

            _renderValue: function (value) {
                this._updateHandle(this.$.mainHandle, value);
            },

            _renderStartValue: function (value) {
                if (this.$.range) {
                    this._updateHandle(this.$.startHandle, value);
                }
            },

            _onDomAdded: function () {
                this.callBase();

                this._renderValue(this.$.value);
                this._renderStartValue(this.$.startValue);
            },

            _renderOrientation: function (orientation, old) {
                old && this.removeClass(old);
                this.addClass(orientation);
            },

            _updateHandle: function (handle, v) {
                var percentage = ((v - this.$.min) / (this.$.max - this.$.min)),
                    $sliderEl = this.$.sliderBar.$el,
                    pos,
                    widthAttribute = "offsetWidth",
                    leftAttribute = "left",
                    rightAttribute = "right";
                if (this.$.orientation == ORIENTATION.VERTICAL) {
                    widthAttribute = "offsetHeight";
                    leftAttribute = "bottom";
                    rightAttribute = "top";
                }
                var offsetWidth = this.$el[widthAttribute];
                pos = offsetWidth * percentage;
                handle.$el.style[leftAttribute] = (pos - handle.$el[widthAttribute] * 0.5) + "px";
                if (handle === this.$.mainHandle) {
                    $sliderEl.style[rightAttribute] = (offsetWidth - pos) + "px";
                    if (!this.$.range) {
                        $sliderEl.style[leftAttribute] = "0px";
                    }
                } else {
                    $sliderEl.style[leftAttribute] = pos + "px";
                }

            },

            _handleWindowUp: function (e) {
                this.$currentHandle = null;
                this.dom(this.$stage.$window).unbindDomEvent('pointerup', this._windowUpListener);
                this.dom(this.$stage.$window).unbindDomEvent('pointermove', this._windowUpListener);

            }
        });
    }
);