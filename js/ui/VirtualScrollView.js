define(['js/ui/View', 'js/core/Bindable', 'js/core/List', 'js/data/Collection', 'underscore'], function (View, _) {

    /***
     * defines an ItemsView which can show parts of data
     */
    return View.inherit('js.ui.VirtualScrollView', {
        defaults: {
            scrollTop: 0,
            scrollLeft: 0,
            updateHeightPolicy: 'in',
            updateWidthPolicy: 'in',
            componentClass: 'scroll-container',
            vertical: true,
            horizontal: false,
            mouseTracking: false
        },
        ctor: function () {
            this.callBase();

            this.$mouseWheelMult = 1;

            // TODO: put this in stage or somewhere else
            var userAgent = this.get(this.$stage.$window, "navigator.userAgent");
            if (userAgent) {
                this.$isChrome = userAgent.toLowerCase().indexOf('chrome') > -1;
                this.$isFirefox = userAgent.toLowerCase().indexOf('firefox') > -1;
                if (this.$isChrome) {
                    this.$mouseWheelMult = 0.1;
                }


            }

            this.$speed = {x: 0, y: 0};
            this.$currentPos = {x: 0, y: 0};
            this.$newPos = {x: 0, y: 0};
            this.$mousePos = {x: 0, y: 0};
            this.$trackedPos = {x: 0, y: 0};
            this.$isPositiv = {x: false, y: false};
            this.$isOutOfBounce = {x: false, y: false};
            this.$mult = {x: 0, y: 0};
            this.$delta = {width: 0, height: 0};
            this.$isMouseDown = false;
            this.$isScrolling = false;
            this.$t = (new Date()).getTime();
            this.$currentT = {x: 0, y: 0};
            this.$keepInBounceInterval = null;
            this.$trackSpeedInterval = null;
            this.$speedInterval = {x: null, y: null};
            this.$propertyMap = {
                x: "offsetWidth",
                y: "offsetHeight"
            };
            this.$axisScrollMap = {
                x: 'scrollLeft',
                y: 'scrollTop'
            };
            this.$fixAxis = {x: false, y: false};
            this.$transformProperty = null;
            this.$blockMouseWheelTimeout = null;
            this.$blockMouseWheel = false;
        },
        _getTransformProperty: function (element) {
            // Note that in some versions of IE9 it is critical that
            // msTransform appear in this list before MozTransform
            var properties = [
                'transform',
                'WebkitTransform',
                'msTransform',
                'MozTransform',
                'OTransform'
            ];
            var p;
            while (p = properties.shift()) {
                if (typeof element.style[p] !== 'undefined') {
                    return p;
                }
            }
            return false;
        },
        _startTracking: function (x, y) {
            if (this.$speedInterval.x) {
                clearInterval(this.$speedInterval.x);
            }
            if (this.$speedInterval.y) {
                clearInterval(this.$speedInterval.y);
            }

            this.$t = new Date().getTime();
            this.$mousePos.x = x;
            this.$mousePos.y = y;

            this.$isMouseDown = true;
        },
        _initSpeedInterval: function (axis, dt) {
            if (this.$speedInterval[axis]) {
                clearInterval(this.$speedInterval[axis]);
            }

            this.$speed[axis] = (this.$trackedPos[axis] - this.$newPos[axis]) / dt;

            if (this.$speed[axis] !== 0) {

                var sub = this.$speed[axis] * 0.02;
                var d;
                this.$isPositiv[axis] = this.$speed[axis] >= 0;

                var self = this;
                this.$speedInterval[axis] = setInterval(function () {
                    if (self.$isOutOfBounce[axis] || self.$isPositiv[axis] && self.$speed[axis] <= 0 || !self.$isPositiv[axis] && self.$speed[axis] >= 0) {
                        clearInterval(self.$speedInterval[axis]);
                    }
                    d = (self.$speed[axis] * ((new Date().getTime()) - self.$currentT[axis]));
                    if (axis == "x") {
                        self._moveBy(d, 0);
                    } else {
                        self._moveBy(0, d);
                    }

                    self.$speed[axis] = self.$speed[axis] - sub;

                    self.$currentT[axis] = new Date().getTime();
                }, 1);
            }
        },
        _stopTracking: function () {
            this.$isMouseDown = false;

            this.$currentT.x = this.$currentT.y = new Date().getTime();

            var dt = this.$currentT.x - this.$t;

            if (this.$.horizontal) {
                this._initSpeedInterval("x", dt);
            }

            if (this.$.vertical) {
                this._initSpeedInterval("y", dt);
            }
        },
        _getScrollContainer: function () {
            var scrollContainer = this.get('$scrollContainer');
            if (!scrollContainer) {
                throw "implement _getScrollContainer or set cid='$scrollContainer'";
            }
            return scrollContainer;
        },
        render: function () {
            var el = this.callBase();
            this.$scrollPane = this._getScrollContainer();
            // this.$scrollPane = el.childNodes[0];

            this.$transformProperty = this._getTransformProperty(el);

            var self = this;

            var spanMap = this.$propertyMap;
            var delta;
            var keepInBounce = function (axis) {
                delta = self.$el[spanMap[axis]] - self.$scrollPane[spanMap[axis]];
                if (delta < 0 && !self.$isMouseDown && !self.$isScrolling && (self.$newPos[axis] > 0 || self.$newPos[axis] < delta)) {
                    self.$isOutOfBounce[axis] = true;
                    self.$mult[axis] = (self.$newPos[axis] > 0 ? -1 : 1);
                    self.$newPos[axis] = self.$newPos[axis] + 0.03 * self.$el[spanMap[axis]] * self.$mult[axis];
                    if (self.$newPos[axis] < 0 && self.$mult[axis] < 0) {
                        self.$newPos[axis] = 0;
                    }

                    if (self.$newPos[axis] > delta && self.$mult[axis] > 0) {
                        self.$newPos[axis] = delta;
                    }

                    self.updatePosition(self.$newPos.x, self.$newPos.y);
//                    self._setCssTranslate(self.$newPos.x, self.$newPos.y);
                    self.$currentPos[axis] = self.$newPos[axis];
                } else {
                    self.$isOutOfBounce[axis] = false;
                }
            };

//
            this.$keepInBounceInterval = setInterval(function () {
                if (self.$.horizontal) {
                    keepInBounce("x");
                }
                if (self.$.vertical) {
                    keepInBounce("y");
                }
            }, 20);
//
            this.$trackSpeedInterval = setInterval(function () {
                if (self.$isMouseDown) {
                    self.$t = (new Date().getTime());
                }
                self.$trackedPos.x = self.$newPos.x;
                self.$trackedPos.y = self.$newPos.y;

            }, 100);

            return el;
        },
        _calculateDelta: function (val, axis) {
            if (val === 0 || !this.$isMouseDown) {
                return val;
            }
            var delta = this.$el[this.$propertyMap[axis]] - this.$scrollPane[this.$propertyMap[axis]];

            if (val > 0) {
                if (this.$mousePos[axis] > this.$el[this.$propertyMap[axis]] || delta > 0) {

                    return 0;
                } else if (this.$currentPos[axis] > 0 || this.$currentPos[axis] < delta) {
                    return val * ((this.$el[this.$propertyMap[axis]] - this.$mousePos[axis]) / this.$el[this.$propertyMap[axis]]);
                }

            } else {
                if (this.$mousePos[axis] < 0 || delta > 0) {
                    return 0;
                } else if (this.$currentPos[axis] > 0 || this.$currentPos[axis] < delta) {
                    return val * (( this.$mousePos[axis]) / this.$el[this.$propertyMap[axis]]);
                }
            }

            return val;

        },
        _moveBy: function (dx, dy) {
            var ndx = this._calculateDelta(dx * this.$.horizontal, "x");
            var ndy = this._calculateDelta(dy * this.$.vertical, "y");

            if (Math.abs(dx) > Math.abs(dy)) {
                ndy = 0;
            } else {
                ndx = 0;
            }

            this.$newPos.x = this.$currentPos.x - ndx;
            this.$newPos.y = this.$currentPos.y - ndy;

            this.updatePosition(this.$newPos.x, this.$newPos.y);
//            this._setCssTranslate(this.$newPos.x, this.$newPos.y);

            this.$currentPos.x = this.$newPos.x;
            this.$currentPos.y = this.$newPos.y;
        },
        _onWheel: function (e) {

        },
        _posToCss: function (x, y) {
            return 'translate3d(' + x + "px," + y + "px,0px)";
        },
        updatePosition: function (x, y) {
//            this.set({
//                scrollLeft: x,
//                scrollTop: y
//            });
            this._setCssTranslate(-x, -y);
        },
        _setCssTranslate: function (x, y) {
            if (this.$scrollPane.isRendered()) {
                this.$scrollPane.$el.style[this.$transformProperty] = this._posToCss(x, y);
            }
        },
        _bindDomEvents: function (el) {
            this.callBase();

            var self = this;

            if (el.hasOwnProperty('ontouchstart')) {
                // were on a mobile device

                this.bindDomEvent('touchstart', function (e) {
                    if (e.touches.length == 1) {
                        self._startTracking(e.touches[0].clientX, e.touches[0].clientY);
                        e.preventDefault();
                    }
                });
                this.bindDomEvent('touchmove', function (e) {
                    if (e.touches.length == 1) {
                        if (self.$isMouseDown) {
                            if (self._moveBy(e.touches[0].clientX - self.$mousePos.x, e.touches[0].clientY - self.$mousePos.y)) {
                                e.stopPropagation();
                            }
                            self.$mousePos.x = e.touches[0].clientX;
                            self.$mousePos.y = e.touches[0].clientY;
                        }
                    }
                });
                this.bindDomEvent('touchend', function (e) {
                    self._stopTracking();
                });
            } else {
                if (this.$.mouseTracking) {
                    this.bindDomEvent('mousemove', function (e) {
                        if (self.$isMouseDown) {

                            self._moveBy(e.clientX - self.$mousePos.x, e.clientY - self.$mousePos.y);
                            self.$mousePos.x = e.clientX;
                            self.$mousePos.y = e.clientY;

                            e.preventDefault();
                        }
                    });
                    this.bindDomEvent('mousedown', function (e) {
                        self._startTracking(e.clientX, e.clientY);
                    });
                    this.bindDomEvent('mouseup', function (e) {
                        self._stopTracking();
                    });
                }

                var onWheel = function (e) {
                    e = e || window.event; // for IE

                    var deltaX = 0,
                        deltaY = 0;

                    // check target and scroll
                    if (e.wheelDeltaX) {
                        deltaX = e.wheelDeltaX * 2;
                    }

                    if (e.wheelDeltaY) {
                        deltaY = e.wheelDeltaY * 2;
                    }

                    var delta = e.detail ? e.detail * (-3) : e.wheelDelta;

                    if (e.axis && e.axis == 1) {
                        deltaX = delta * self.$mouseWheelMult;
                    } else {
                        deltaY = delta * self.$mouseWheelMult;
                    }

                    // TODO: fix scrolling out of border
//                            if(self.$isOutOfBounce["y"]){
//                                self.$blockMouseWheel = true;
//                                self.$border = self.$currentPos;
//                            }else if(deltaY < self.$border){
//                                self.$blockMouseWheel = false;
//                            }
                    if (!self.$blockMouseWheel) {
                        self._moveBy(-deltaX, -deltaY);
                    }
                    e.preventDefault();

                };

//                this.bindDomEvent("DOMMouseScroll", onWheel, false);
//                this.bindDomEvent("mousewheel", onWheel, false);
            }


        }
    });
});
